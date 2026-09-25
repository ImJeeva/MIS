"""
Chest X-ray screening predictor.

Two operating modes, chosen automatically at startup:

1. "cnn"        - a trained Keras model at model/pneumonia_densenet169.keras is
                  present AND tensorflow is importable. This is the real model,
                  produced by train_colab.ipynb (DenseNet-169 transfer learning,
                  mirroring Varshni et al., IEEE 2019).

2. "heuristic"  - no trained model available. A lightweight, deterministic
                  computer-vision heuristic on lung-field opacity and texture.
                  Good enough to demo the full product flow; clearly labelled as
                  uncalibrated so nobody mistakes it for the real thing.

The FastAPI layer never needs to know which mode is active - the response shape
is identical.
"""
from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

MODEL_DIR = Path(__file__).parent / "model"
KERAS_MODEL_PATH = MODEL_DIR / "pneumonia_densenet169.keras"
WEIGHTS_PATH = MODEL_DIR / "pneumonia_densenet169.weights.h5"
META_PATH = MODEL_DIR / "model_meta.json"

IMG_SIZE = 224
THRESHOLD = 0.5

ABNORMAL_LABEL = "Possible abnormality detected"
NORMAL_LABEL = "No abnormality detected"


@dataclass
class Prediction:
    prediction: str          # "ABNORMAL" | "NORMAL"
    label: str
    confidence: float        # confidence in the *reported* class, 0..1
    probability_abnormal: float
    model_name: str
    model_version: str
    mode: str
    inference_ms: int


def _load_image(data: bytes) -> Image.Image:
    from io import BytesIO

    img = Image.open(BytesIO(data))
    img.load()
    return img.convert("RGB")


# --------------------------------------------------------------------------- #
# Heuristic mode
# --------------------------------------------------------------------------- #
def _heuristic_probability(img: Image.Image) -> float:
    g = np.asarray(img.convert("L").resize((256, 256)), dtype=np.float32) / 255.0
    h, w = g.shape
    overall_mean = float(g.mean()) + 1e-6

    # Rough left / right lung-field windows (avoid the bright mediastinum column).
    y0, y1 = int(0.30 * h), int(0.82 * h)
    left = g[y0:y1, int(0.18 * w):int(0.42 * w)]
    right = g[y0:y1, int(0.58 * w):int(0.82 * w)]
    lung = np.concatenate([left.ravel(), right.ravel()])

    lung_mean = float(lung.mean())
    opacity = lung_mean / overall_mean                      # >1 => hazy lungs

    # Local texture: healthy lungs show crisp vascular markings => higher local std.
    def local_contrast(roi: np.ndarray) -> float:
        ts = 16
        vals = []
        for i in range(0, roi.shape[0] - ts, ts):
            for j in range(0, roi.shape[1] - ts, ts):
                vals.append(roi[i:i + ts, j:j + ts].std())
        return float(np.mean(vals)) if vals else 0.0

    contrast = 0.5 * (local_contrast(left) + local_contrast(right))

    # A bright consolidation blob pushes the 95th percentile well above the median.
    blob = float(np.percentile(lung, 95) - np.median(lung))

    z = (
        7.5 * (opacity - 1.03)       # hazy lung fields
        - 14.0 * (contrast - 0.085)  # loss of fine texture
        + 6.0 * (blob - 0.14)        # focal opacity
        + 0.20
    )
    return float(1.0 / (1.0 + np.exp(-z)))


class Predictor:
    def __init__(self) -> None:
        self.mode = "heuristic"
        self.model_name = "opacity-texture-heuristic"
        self.model_version = "uncalibrated"
        self._keras = None
        self._preprocess = None
        self._try_load_keras()

    def _build_architecture(self):
        """Rebuilds the exact head from train_colab.ipynb, for weights-only loading."""
        import tensorflow as tf
        from tensorflow.keras import layers, models
        from tensorflow.keras.applications import DenseNet169

        base = tf.keras.applications.DenseNet169(
            include_top=False, weights=None, input_shape=(IMG_SIZE, IMG_SIZE, 3), pooling="avg"
        )
        return models.Sequential(
            [
                base,
                layers.Dropout(0.3),
                layers.Dense(128, activation="relu"),
                layers.Dropout(0.2),
                layers.Dense(1, activation="sigmoid"),
            ]
        )

    def _apply_meta(self):
        self.model_name = "DenseNet169-TL"
        self.model_version = "1.0"
        if META_PATH.exists():
            try:
                meta = json.loads(META_PATH.read_text())
                self.model_name = meta.get("model_name", self.model_name)
                self.model_version = meta.get("model_version", self.model_version)
            except Exception:  # noqa: BLE001
                pass

    def _warm_up(self) -> None:
        """TensorFlow's first predict() is very slow (graph tracing / kernel init, 20+ s on a
        CPU). Do it once at startup so the first real upload is as fast as the rest."""
        try:
            self._keras.predict(np.zeros((1, IMG_SIZE, IMG_SIZE, 3), dtype=np.float32), verbose=0)
        except Exception as exc:  # noqa: BLE001
            print(f"[predictor] warm-up skipped ({exc})")

    def _try_load_keras(self) -> None:
        os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

        # Preferred: weights-only. Immune to full-model serialization/Keras-
        # version mismatches between the Colab environment and this machine.
        if WEIGHTS_PATH.exists():
            try:
                import tensorflow as tf  # noqa: WPS433 (optional heavy import)
                from tensorflow.keras.applications.densenet import preprocess_input

                model = self._build_architecture()
                model.load_weights(WEIGHTS_PATH)
                self._keras = model
                self._preprocess = preprocess_input
                self.mode = "cnn"
                self._apply_meta()
                self._warm_up()
                print(f"[predictor] loaded trained CNN from weights ({self.model_name} v{self.model_version})")
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[predictor] could not load weights ({exc}); trying full model file")

        if KERAS_MODEL_PATH.exists():
            try:
                import tensorflow as tf  # noqa: WPS433
                from tensorflow.keras.applications.densenet import preprocess_input

                self._keras = tf.keras.models.load_model(KERAS_MODEL_PATH)
                self._preprocess = preprocess_input
                self.mode = "cnn"
                self._apply_meta()
                self._warm_up()
                print(f"[predictor] loaded trained CNN ({self.model_name} v{self.model_version})")
                return
            except Exception as exc:  # noqa: BLE001
                print(f"[predictor] could not load Keras model ({exc}); falling back to heuristic")

        if not WEIGHTS_PATH.exists() and not KERAS_MODEL_PATH.exists():
            print(f"[predictor] no trained model in {MODEL_DIR} - using heuristic mode")
        self._keras = None
        self.mode = "heuristic"

    def _cnn_probability(self, img: Image.Image) -> float:
        arr = np.asarray(img.resize((IMG_SIZE, IMG_SIZE)), dtype=np.float32)
        arr = self._preprocess(arr)
        arr = np.expand_dims(arr, 0)
        out = self._keras.predict(arr, verbose=0)
        out = np.asarray(out).ravel()
        if out.size == 1:                       # sigmoid head => P(abnormal)
            return float(out[0])
        return float(out[1] / (out.sum() + 1e-9))  # 2-way softmax => class 1 = abnormal

    def predict(self, data: bytes) -> Prediction:
        started = time.perf_counter()
        img = _load_image(data)

        if self.mode == "cnn":
            p_abn = self._cnn_probability(img)
        else:
            p_abn = _heuristic_probability(img)

        p_abn = max(0.0, min(1.0, p_abn))
        is_abnormal = p_abn >= THRESHOLD
        confidence = p_abn if is_abnormal else 1.0 - p_abn

        return Prediction(
            prediction="ABNORMAL" if is_abnormal else "NORMAL",
            label=ABNORMAL_LABEL if is_abnormal else NORMAL_LABEL,
            confidence=round(confidence, 4),
            probability_abnormal=round(p_abn, 4),
            model_name=self.model_name,
            model_version=self.model_version,
            mode=self.mode,
            inference_ms=int((time.perf_counter() - started) * 1000),
        )
