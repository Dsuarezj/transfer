"""
Plantilla mínima para entrenar un detector de regiones (transfer_number) y exportarlo a Keras (model.h5).
Este script es una guía: ajusta rutas, dataset y número de épocas según tus datos.
"""

import os
from pathlib import Path

import tensorflow as tf

# Rutas
DATA_DIR = Path(__file__).parent / "images"
ANNOTATIONS = Path(__file__).parent / "annotations.json"  # esperado COCO
OUTPUT_DIR = Path(__file__).parent / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
MODEL_H5 = OUTPUT_DIR / "model.h5"


def load_dataset():
    """
    TODO: Implementa carga de tu dataset:
    - Lee annotations.json (COCO)
    - Crea tf.data.Dataset con (image, boxes, labels)
    - Normaliza imágenes al tamaño esperado (ej. 320x320)
    Nota: Para un prototipo rápido puedes usar un dataset pequeño y un batch size de 4.
    """
    raise NotImplementedError("Implementa la carga de tu dataset COCO aquí.")


def build_model(num_classes: int = 1) -> tf.keras.Model:
    """
    Crea un detector simple usando transferencia con MobileNetV2 + cabeza pequeña.
    Para producción, considera un modelo SSD/RetinaNet; aquí buscamos simplicidad.
    """
    base = tf.keras.applications.MobileNetV2(
        input_shape=(320, 320, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False  # fine-tuning ligero después

    x = tf.keras.layers.Conv2D(256, 3, padding="same", activation="relu")(base.output)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    # Predicción de caja (x, y, w, h) normalizada y clase
    bbox = tf.keras.layers.Dense(4, activation="sigmoid", name="bbox")(x)
    cls = tf.keras.layers.Dense(num_classes, activation="sigmoid", name="class")(x)

    model = tf.keras.Model(inputs=base.input, outputs=[bbox, cls])
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-3),
        loss={
            "bbox": tf.keras.losses.MeanSquaredError(),
            "class": tf.keras.losses.BinaryCrossentropy(),
        },
        loss_weights={"bbox": 1.0, "class": 1.0},
        metrics={"class": "accuracy"},
    )
    return model


def main():
    print("1) Cargando dataset...")
    # dataset = load_dataset()
    # train_ds, val_ds = dataset["train"], dataset["val"]
    # Nota: mientras implementas load_dataset, puedes comentar líneas de entrenamiento.

    print("2) Construyendo modelo...")
    model = build_model(num_classes=1)

    print("3) Entrenando (ajusta epochs y ds cuando implementes load_dataset)...")
    # history = model.fit(
    #     train_ds,
    #     validation_data=val_ds,
    #     epochs=5,
    # )

    print("4) Guardando modelo Keras en:", MODEL_H5)
    model.save(MODEL_H5)
    print("Listo. Luego convierte con tensorflowjs_converter:")
    print(
        "tensorflowjs_converter --input_format keras "
        f"{MODEL_H5} ./public/models/v1"
    )


if __name__ == "__main__":
    main()

