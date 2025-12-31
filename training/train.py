"""
Entrenamiento para detector de región (transfer_number).
Guarda en formato SavedModel para mejor compatibilidad con TensorFlow.js.
"""

import json
import random
from pathlib import Path

import tensorflow as tf

# Rutas
DATA_DIR = Path(__file__).parent / "images"
ANNOTATIONS = Path(__file__).parent / "annotations.json"
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
SAVED_MODEL_DIR = OUTPUT_DIR / "saved_model"
MODEL_H5 = OUTPUT_DIR / "model.h5"

IMG_SIZE = 320
BATCH_SIZE = 8
EPOCHS = 10


def load_dataset():
    """
    Lee COCO (una clase: transfer_number) y crea un tf.data con bbox normalizados.
    """
    coco = json.loads(ANNOTATIONS.read_text())
    images_by_id = {img["id"]: img for img in coco["images"]}
    anns_by_img = {}
    for ann in coco["annotations"]:
        anns_by_img.setdefault(ann["image_id"], []).append(ann)

    samples = []
    for img_id, img_info in images_by_id.items():
        file_name = img_info["file_name"]
        img_path = DATA_DIR / file_name
        if not img_path.exists():
            print(f"   ⚠ Imagen no encontrada: {file_name}")
            continue
        anns = anns_by_img.get(img_id, [])
        if len(anns) == 0:
            print(f"   ⚠ Sin anotaciones: {file_name}")
            continue
        ann = anns[0]
        x, y, w, h = ann["bbox"]
        iw, ih = img_info["width"], img_info["height"]
        # normalizar a [0,1] en orden [ymin, xmin, ymax, xmax]
        bbox_norm = [y / ih, x / iw, (y + h) / ih, (x + w) / iw]
        samples.append((str(img_path), bbox_norm))

    print(f"   ✓ {len(samples)} muestras válidas encontradas")
    
    if len(samples) == 0:
        raise ValueError("No se encontraron muestras válidas. Verifica annotations.json y las imágenes.")

    random.shuffle(samples)
    split = int(len(samples) * 0.9)
    train_samples = samples[:split]
    val_samples = samples[split:] if split < len(samples) else samples[-1:]

    def _make_ds(items):
        if len(items) == 0:
            return None
        paths = [p for p, _ in items]
        bboxes = [b for _, b in items]
        ds = tf.data.Dataset.from_tensor_slices((paths, bboxes))
        ds = ds.shuffle(len(paths))
        ds = ds.map(_load, num_parallel_calls=tf.data.AUTOTUNE)
        ds = ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)
        return ds

    def _load(path, bbox):
        img = tf.io.read_file(path)
        img = tf.image.decode_jpeg(img, channels=3)
        img = tf.image.convert_image_dtype(img, tf.float32)
        img = tf.image.resize(img, (IMG_SIZE, IMG_SIZE))
        return img, bbox

    return {"train": _make_ds(train_samples), "val": _make_ds(val_samples)}


def build_model() -> tf.keras.Model:
    """
    Modelo simple: MobileNetV2 base + cabeza de regresión para bbox.
    Solo predice bbox (4 valores), más simple y mejor para conversión.
    """
    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False

    x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
    x = tf.keras.layers.Dense(256, activation="relu")(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    bbox = tf.keras.layers.Dense(4, activation="sigmoid", name="bbox")(x)

    model = tf.keras.Model(inputs=base.input, outputs=bbox)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss=tf.keras.losses.MeanSquaredError(),
        metrics=["mae"],
    )
    return model


def main():
    print("=" * 50)
    print("ENTRENAMIENTO DEL DETECTOR DE NÚMEROS DE TRANSFERENCIA")
    print("=" * 50)
    
    print("\n1) Cargando dataset...")
    dataset = load_dataset()
    train_ds = dataset["train"]
    val_ds = dataset["val"]
    
    train_count = sum(1 for _ in train_ds) if train_ds else 0
    val_count = sum(1 for _ in val_ds) if val_ds else 0
    print(f"   Train batches: {train_count}, Val batches: {val_count}")

    # Recargar porque iteramos para contar
    dataset = load_dataset()
    train_ds = dataset["train"]
    val_ds = dataset["val"]

    print("\n2) Construyendo modelo...")
    model = build_model()
    model.summary()

    print("\n3) Entrenando...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS,
        verbose=1,
    )
    
    final_loss = history.history.get("loss", [0])[-1]
    final_mae = history.history.get("mae", [0])[-1]
    print(f"\n   ✓ Entrenamiento completado")
    print(f"   Loss final: {final_loss:.4f}")
    print(f"   MAE final: {final_mae:.4f}")

    print("\n4) Guardando modelo...")
    
    # Guardar en formato H5 (legacy)
    model.save(MODEL_H5)
    print(f"   ✓ Keras H5: {MODEL_H5}")
    
    # Guardar en formato SavedModel (mejor para conversión)
    model.save(str(SAVED_MODEL_DIR))
    print(f"   ✓ SavedModel: {SAVED_MODEL_DIR}")

    print("\n" + "=" * 50)
    print("CONVERSIÓN A TENSORFLOW.JS")
    print("=" * 50)
    print("\nEjecuta el siguiente comando para convertir:")
    print(f"\n  python training/convert_to_tfjs.py")
    print("\nO manualmente con:")
    print(f"\n  tensorflowjs_converter \\")
    print(f"    --input_format=tf_saved_model \\")
    print(f"    --output_format=tfjs_graph_model \\")
    print(f"    {SAVED_MODEL_DIR} \\")
    print(f"    ./public/models/v1")


if __name__ == "__main__":
    main()
