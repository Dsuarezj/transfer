# Entrenamiento del Detector de Números de Transferencia

Este directorio contiene todo lo necesario para entrenar un modelo de detección de regiones para números de transferencia bancarios.

## Requisitos

- Python 3.9+ (probado con Python 3.9.6)
- macOS, Linux o Windows

## Estructura

```
training/
├── images/              # Imágenes de entrenamiento con cuadros rojos
├── annotations.json     # Anotaciones en formato COCO
├── output/              # Modelos entrenados
│   ├── model.h5         # Modelo Keras
│   └── saved_model/     # SavedModel de TensorFlow
├── train.py             # Script de entrenamiento
├── convert_simple.py    # Script de conversión a TensorFlow.js
└── requirements.txt     # Dependencias Python
```

## Pasos para Entrenar y Publicar el Modelo

### 1. Preparar Imágenes

1. Coloca las imágenes de comprobantes en `training/images/`
2. En cada imagen, dibuja un **cuadro rojo** alrededor del número de transferencia
   - El cuadro debe ser de color rojo puro (R>200, G<80, B<80)
3. Ejecuta el script para generar anotaciones (si es necesario)

### 2. Crear Entorno Virtual e Instalar Dependencias

```bash
cd /Users/denissesuarezjimenez/Documents/productos/transfer

# Crear entorno virtual
python3 -m venv venv-train

# Activar entorno
source venv-train/bin/activate  # macOS/Linux
# venv-train\Scripts\activate   # Windows

# Instalar dependencias
pip install --upgrade pip
pip install tensorflow==2.15.0 numpy pillow
```

### 3. Entrenar el Modelo

```bash
# Asegúrate de tener el venv activado
source venv-train/bin/activate

# Ejecutar entrenamiento
python training/train.py
```

El script:
- Carga las imágenes y anotaciones COCO
- Entrena un modelo MobileNetV2 para detectar regiones
- Guarda el modelo en `training/output/`

**Salida esperada:**
```
==================================================
ENTRENAMIENTO DEL DETECTOR DE NÚMEROS DE TRANSFERENCIA
==================================================

1) Cargando dataset...
   ✓ 39 muestras válidas encontradas

2) Construyendo modelo...
   ...

3) Entrenando...
   Epoch 1/10
   ...

4) Guardando modelo...
   ✓ Keras H5: training/output/model.h5
   ✓ SavedModel: training/output/saved_model
```

### 4. Convertir a TensorFlow.js

```bash
# Con el venv activado
python training/convert_simple.py
```

Este script:
- Carga el modelo entrenado
- Extrae los pesos
- Genera `model.json` y `group1-shard1of1.bin`
- Los guarda en `public/models/v1/`

**Salida esperada:**
```
==================================================
CONVERSIÓN A TENSORFLOW.JS
==================================================

1) Cargando modelo...
   ...

2) Extrayendo pesos...
   ...

3) Guardando pesos...
   ✓ group1-shard1of1.bin: ~10 MB

4) Generando model.json...
   ✓ model.json

5) Actualizando versión...
   ✓ model-version.json

==================================================
✓ CONVERSIÓN COMPLETADA
==================================================

Archivos generados en: public/models/v1/
  - group1-shard1of1.bin
  - model-version.json
  - model.json
```

### 5. Desplegar

Los archivos en `public/models/v1/` se suben automáticamente con Vercel:

```bash
# Verificar archivos
ls -la public/models/v1/

# Desplegar
git add public/models/v1/
git commit -m "feat: add trained OCR model v1.0"
git push
```

## Actualizar el Modelo

Cuando quieras actualizar el modelo:

1. Añade más imágenes con cuadros rojos a `training/images/`
2. Regenera `annotations.json` si es necesario
3. Ejecuta `python training/train.py`
4. Ejecuta `python training/convert_simple.py`
5. **Incrementa la versión** en `public/models/v1/model-version.json`
6. Despliega

La app automáticamente detectará la nueva versión y descargará el modelo actualizado.

## Comandos Rápidos

```bash
# Todo el flujo de una vez (desde el directorio raíz del proyecto)
cd /Users/denissesuarezjimenez/Documents/productos/transfer
source venv-train/bin/activate
python training/train.py && python training/convert_simple.py
```

## Notas Técnicas

### Modelo
- **Base**: MobileNetV2 (pesos ImageNet)
- **Entrada**: 320x320x3 (RGB normalizado)
- **Salida**: 4 valores [ymin, xmin, ymax, xmax] normalizados [0,1]
- **Tamaño**: ~10 MB

### Caché del Modelo
- El modelo se cachea en IndexedDB del navegador
- La versión se guarda en localStorage
- Se actualiza automáticamente cuando hay nueva versión

### Fallback
- Si no hay modelo custom disponible, se usa COCO-SSD como fallback
- COCO-SSD detecta objetos genéricos y usa heurísticas para encontrar regiones de texto
