# MIS AI Service

FastAPI microservice that screens a chest X-ray and returns a first-look flag.

```
POST /predict   multipart form field `file` (image)
  -> { prediction: "ABNORMAL" | "NORMAL",
       label: "Possible abnormality detected" | "No abnormality detected",
       confidence: 0.0-1.0,
       probability_abnormal: 0.0-1.0,
       model_name, model_version, mode, inference_ms }

GET  /health    -> { up, mode, model_name, model_version, calibrated }
```

## Two modes (chosen automatically at startup)

| mode | when | notes |
|---|---|---|
| `cnn` | `model/pneumonia_densenet169.keras` exists **and** `tensorflow` is importable | the real trained model (DenseNet-169 transfer learning) |
| `heuristic` | otherwise | deterministic lung-field opacity/texture heuristic; `model_version` is reported as `uncalibrated`. Lets the whole product run before the model is trained. |

## Run it (heuristic mode — no training needed)

```bash
cd ai-service
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app:app --port 8000
```

Smoke test:

```bash
curl -F file=@samples/pneumonia_01.png http://localhost:8000/predict
```

## Upgrade to the real CNN

1. Open `train_colab.ipynb` in Google Colab, set runtime to **GPU**, run all cells
   (~20 min). It downloads the Kaggle *Chest X-Ray Images (Pneumonia)* dataset,
   trains a DenseNet-169 transfer-learning model, prints AUC / confusion matrix,
   and downloads `pneumonia_densenet169.keras` + `model_meta.json`.
   *(CPU alternative: `python train_local.py`.)*
2. Put both files in `ai-service/model/`.
3. `pip install -r requirements-ml.txt`
4. Restart `uvicorn`. `GET /health` should now report `"mode": "cnn"`.

## Relation to the paper

Varshni et al., *"Pneumonia Detection Using CNN based Feature Extraction"* (IEEE,
2019) use a pre-trained **DenseNet-169** as a feature extractor followed by an
**SVM (RBF)** classifier for binary normal/abnormal chest X-ray classification.
This service keeps the DenseNet-169 backbone and the same binary task; the head
is a small trainable dense classifier instead of a separate SVM, which is simpler
to serve and gives comparable accuracy on the Kermany dataset.
