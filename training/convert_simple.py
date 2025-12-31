"""
Script de conversión simplificado SavedModel -> TensorFlow.js
Compatible con TensorFlow 2.15 + Keras 2.15
"""

import json
import os
import shutil
from pathlib import Path
from datetime import datetime

import numpy as np
import tensorflow as tf

# Paths
SAVED_MODEL_DIR = Path(__file__).parent / "output" / "saved_model"
MODEL_H5 = Path(__file__).parent / "output" / "model.h5"
TFJS_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "models" / "v1"


def convert_to_tfjs():
    """
    Convierte el modelo SavedModel a formato TensorFlow.js (layers model).
    Extrae pesos y genera model.json manualmente.
    """
    
    print("=" * 50)
    print("CONVERSIÓN A TENSORFLOW.JS")
    print("=" * 50)
    
    # Verificar que existen los archivos
    if not MODEL_H5.exists() and not SAVED_MODEL_DIR.exists():
        print(f"✗ Error: No existe el modelo")
        print("  Primero ejecuta: python training/train.py")
        return False
    
    # Crear directorio de salida
    TFJS_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    try:
        # Cargar modelo
        print("\n1) Cargando modelo...")
        if MODEL_H5.exists():
            model = tf.keras.models.load_model(str(MODEL_H5))
            print(f"   Cargado desde: {MODEL_H5}")
        else:
            model = tf.keras.models.load_model(str(SAVED_MODEL_DIR))
            print(f"   Cargado desde: {SAVED_MODEL_DIR}")
        
        print(f"   Nombre: {model.name}")
        print(f"   Input: {model.input_shape}")
        print(f"   Output: {model.output_shape}")
        
        # Extraer pesos y crear binarios
        print("\n2) Extrayendo pesos...")
        weights_manifest = []
        all_weights = []
        
        for layer in model.layers:
            layer_weights = layer.get_weights()
            for j, w in enumerate(layer_weights):
                weight_name = layer.weights[j].name
                # Limpiar nombre (quitar :0)
                clean_name = weight_name.replace(":0", "")
                
                weights_manifest.append({
                    "name": clean_name,
                    "shape": list(w.shape),
                    "dtype": "float32"
                })
                all_weights.append(w.flatten().astype(np.float32))
                print(f"   - {clean_name}: {w.shape}")
        
        # Combinar todos los pesos
        print("\n3) Guardando pesos...")
        if all_weights:
            combined = np.concatenate(all_weights)
            bin_path = TFJS_OUTPUT_DIR / "group1-shard1of1.bin"
            combined.tofile(str(bin_path))
            print(f"   ✓ {bin_path.name}: {combined.nbytes / 1024:.1f} KB")
        
        # Crear model.json
        print("\n4) Generando model.json...")
        
        # Obtener configuración del modelo
        model_config = json.loads(model.to_json())
        
        model_json = {
            "format": "layers-model",
            "generatedBy": f"tensorflow v{tf.__version__}",
            "convertedBy": "custom-tfjs-converter v1.0",
            "modelTopology": model_config,
            "weightsManifest": [{
                "paths": ["group1-shard1of1.bin"],
                "weights": weights_manifest
            }]
        }
        
        model_json_path = TFJS_OUTPUT_DIR / "model.json"
        with open(model_json_path, "w") as f:
            json.dump(model_json, f)
        print(f"   ✓ {model_json_path.name}")
        
        # Crear archivo de versión
        print("\n5) Actualizando versión...")
        version_data = {
            "version": "1.0",
            "type": "layers-model", 
            "framework": "tensorflow.js",
            "inputShape": [320, 320, 3],
            "outputShape": [4],
            "updated": datetime.now().strftime("%Y-%m-%d"),
            "description": "Detector de región para números de transferencia"
        }
        
        version_path = TFJS_OUTPUT_DIR / "model-version.json"
        with open(version_path, "w") as f:
            json.dump(version_data, f, indent=2)
        print(f"   ✓ {version_path.name}")
        
        print("\n" + "=" * 50)
        print("✓ CONVERSIÓN COMPLETADA")
        print("=" * 50)
        
        print(f"\nArchivos generados en: {TFJS_OUTPUT_DIR}")
        total_size = 0
        for f in sorted(TFJS_OUTPUT_DIR.iterdir()):
            size = f.stat().st_size
            total_size += size
            print(f"  - {f.name} ({size / 1024:.1f} KB)")
        print(f"\n  Total: {total_size / 1024:.1f} KB")
        
        return True
        
    except Exception as e:
        import traceback
        print(f"\n✗ Error: {e}")
        traceback.print_exc()
        return False


def main():
    success = convert_to_tfjs()
    
    if success:
        print("\n🎉 ¡Modelo listo para usar!")
        print("\nPara usar en la app:")
        print("  1. Los archivos están en public/models/v1/")
        print("  2. TensorFlow.js los cargará automáticamente")
        print("  3. El modelo detecta la región del número de transferencia")
    else:
        print("\n❌ La conversión falló.")


if __name__ == "__main__":
    main()
