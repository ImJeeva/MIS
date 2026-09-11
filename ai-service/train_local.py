"""
Local CPU/GPU version of train_colab.ipynb. Slower than Colab (1-3 h on CPU) but
needs no browser. Requires:  pip install -r requirements.txt -r requirements-ml.txt kagglehub

Usage:
    python train_local.py --data /path/to/chest_xray      # if you downloaded it yourself
    python train_local.py                                  # auto-download via kagglehub

Output: model/pneumonia_densenet169.keras + model/model_meta.json
Restart the AI service afterwards to pick up the trained model.
"""
import argparse
import json
import os
from pathlib import Path

import numpy as np

MODEL_DIR = Path(__file__).parent / "model"


def get_data(data_arg):
    if data_arg:
        return data_arg
    import kagglehub

    root = kagglehub.dataset_download("paultimothymooney/chest-xray-pneumonia")
    return os.path.join(root, "chest_xray")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default=None, help="path to the chest_xray folder")
    ap.add_argument("--epochs", type=int, default=6)
    ap.add_argument("--batch", type=int, default=32)
    args = ap.parse_args()

    import tensorflow as tf
    from tensorflow.keras import layers, models
    from tensorflow.keras.applications import DenseNet169
    from tensorflow.keras.applications.densenet import preprocess_input

    IMG = 224
    data = get_data(args.data)
    print("dataset:", data, "| TF", tf.__version__)

    def ds(split, shuffle):
        return tf.keras.utils.image_dataset_from_directory(
            os.path.join(data, split),
            labels="inferred",
            label_mode="binary",
            class_names=["NORMAL", "PNEUMONIA"],
            image_size=(IMG, IMG),
            batch_size=args.batch,
            shuffle=shuffle,
            seed=42,
        )

    AUTOTUNE = tf.data.AUTOTUNE
    train_raw, val_raw, test_raw = ds("train", True), ds("val", False), ds("test", False)

    prep = lambda x, y: (preprocess_input(x), y)
    aug = tf.keras.Sequential(
        [layers.RandomFlip("horizontal"), layers.RandomRotation(0.05), layers.RandomZoom(0.1)]
    )
    train = train_raw.map(lambda x, y: (aug(x), y)).map(prep).prefetch(AUTOTUNE)
    val = val_raw.map(prep).prefetch(AUTOTUNE)
    test = test_raw.map(prep).prefetch(AUTOTUNE)

    # class weights
    import collections

    counts = collections.Counter()
    for _, y in train_raw.unbatch():
        counts[int(y.numpy()[0])] += 1
    total = sum(counts.values())
    class_weight = {c: total / (2 * n) for c, n in counts.items()}
    print("counts", dict(counts), "class_weight", class_weight)

    base = DenseNet169(include_top=False, weights="imagenet", input_shape=(IMG, IMG, 3), pooling="avg")
    base.trainable = False
    model = models.Sequential(
        [
            base,
            layers.Dropout(0.3),
            layers.Dense(128, activation="relu"),
            layers.Dropout(0.2),
            layers.Dense(1, activation="sigmoid"),
        ]
    )
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    cb = [tf.keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=3, restore_best_weights=True)]
    model.fit(train, validation_data=val, epochs=args.epochs, class_weight=class_weight, callbacks=cb)

    # fine-tune last block
    base.trainable = True
    for layer in base.layers[:-40]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-5),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )
    model.fit(train, validation_data=val, epochs=max(2, args.epochs // 2), class_weight=class_weight, callbacks=cb)

    from sklearn.metrics import roc_auc_score, confusion_matrix, classification_report

    y_true = np.concatenate([y.numpy().ravel() for _, y in test])
    y_prob = model.predict(test).ravel()
    y_pred = (y_prob >= 0.5).astype(int)
    auc = float(roc_auc_score(y_true, y_prob))
    print("AUC:", round(auc, 4))
    print(confusion_matrix(y_true, y_pred))
    print(classification_report(y_true, y_pred, target_names=["NORMAL", "PNEUMONIA"]))

    MODEL_DIR.mkdir(exist_ok=True)
    model.save(MODEL_DIR / "pneumonia_densenet169.keras")
    json.dump(
        {"model_name": "DenseNet169-TL", "model_version": "1.0", "auc": auc,
         "trained_on": "chest-xray-pneumonia (Kermany)"},
        open(MODEL_DIR / "model_meta.json", "w"),
        indent=2,
    )
    print("Saved to", MODEL_DIR, "- restart the AI service.")


if __name__ == "__main__":
    main()
