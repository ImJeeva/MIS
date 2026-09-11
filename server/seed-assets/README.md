# Seed X-ray images

`normal_01..03.jpg` and `pneumonia_01..02.jpg` are **real, public-domain chest
radiographs** from Wikimedia Commons (US-government / CC works), resized for the
demo. Swap in your own by overwriting them (any of `.jpg/.jpeg/.png/.webp`) and
re-running the seed.

## Use real chest X-rays instead

1. Get real images — free, from Kaggle:
   **Chest X-Ray Images (Pneumonia)**
   https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia
   (`train/NORMAL/*.jpeg` and `train/PNEUMONIA/*.jpeg`)

2. Drop them in this folder using these base names (any of `.jpg` / `.jpeg` /
   `.png` / `.webp` — a real photo extension is picked over the old `.png`):

   | file | should be | seeded result |
   |---|---|---|
   | `pneumonia_01` | a PNEUMONIA image | Flagged |
   | `pneumonia_02` | a PNEUMONIA image | Flagged |
   | `normal_01`    | a NORMAL image    | Clear |
   | `normal_02`    | a NORMAL image    | Clear |
   | `normal_03`    | a NORMAL image    | Clear |

3. Re-seed:

   ```bash
   npm --prefix server run db:seed
   ```

The cards on every dashboard now show your real images.

> The **easiest** path for a live demo is to skip this and just **upload real
> X-rays through the app** (patient → Upload X-ray).

## Will the AI screen them correctly?

- **Now (heuristic mode, no trained model):** you get a result on every image,
  but it's a rough rule-based estimate — not calibrated on real data.
- **After training (recommended):** run `ai-service/train_colab.ipynb` once on
  the free Colab GPU (~20 min), download `pneumonia_densenet169.keras` into
  `ai-service/model/`, restart. Real X-rays then get real DenseNet-169
  predictions.
