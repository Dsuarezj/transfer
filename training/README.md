# Guía rápida para entrenar y publicar el modelo de detección de región (número de comprobante)

Este documento explica cómo crear, convertir y publicar un modelo de detección de la región del número de comprobante para usar en la app (TensorFlow.js en el navegador). Todo se realiza **offline** con datos anonimizados; solo publicas el modelo resultante.

## 0) Situación actual
- La app ya usa COCO-SSD pre-entrenado (sin fine-tuning) para estimar la región.
- El texto se lee con Tesseract + patrones JSON.
- Este flujo es para mejorar la detección de la región entrenando un modelo propio.

## 1) Recolecta datos
- Junta 20–50 comprobantes de prueba (enfocados en los bancos clave).
- Borra/blur toda la info sensible (nombres, cuentas, montos). Solo necesitas que se vea la zona del número de comprobante.
- Opcional: genera comprobantes sintéticos/falsos con Figma/Photoshop para aumentar variedad.

Estructura sugerida:
```
training/
  images/
    pichincha_1.jpg   # anonimizados
    pichincha_2.jpg
    bbva_1.jpg
    ...
  annotations.json    # COCO con bounding boxes de la clase "transfer_number"
  train.py            # script de entrenamiento (lo añadirás tú)
```

## 2) Anota la región del número
- Usa una herramienta de anotación (CVAT, LabelImg, Label Studio).
- Dibuja solo la caja donde aparece el número de comprobante.
- Exporta en formato COCO (recomendado) o Pascal VOC.
- Clase única: `transfer_number`.

## 3) Entrena offline (Python + TensorFlow)
Flujo recomendado en `train.py` (resumen):
1. Cargar dataset COCO (imágenes + cajas).
2. Cargar un detector base ligero (SSD/MobileNet).
3. Congelar capas base y entrenar las últimas (5–10 epochs).
4. Evaluar IoU/mAP en validación; objetivo > 0.7 IoU en la región.
5. Guardar el modelo en `model.h5`.

Si no quieres entrenar todavía, puedes seguir usando COCO-SSD como hasta ahora.

## 4) Convertir a TensorFlow.js
Con TensorFlow.js converter instalado:
```
tensorflowjs_converter --input_format keras ./training/output/model.h5 ./public/models/v1
```
Esto genera `model.json` + shards `.bin`.

## 5) Publicar el modelo
Usa GitHub Pages (simple y gratuito):
```
public/
  models/
    v1/
      model.json
      group1-shard1of1.bin
      model-version.json
```

Ejemplo de `model-version.json`:
```json
{
  "version": "1.0",
  "type": "custom-detector",
  "url": "model.json",
  "updated": "2025-12-31"
}
```

Al desplegar en Pages, la URL sería algo como:
```
https://tu-usuario.github.io/tu-repo/models/v1/model-version.json
```

### Comandos concretos (ejemplo de flujo completo)
```bash
# 1) Instalar dependencias de entrenamiento (en este repo, fuera del build de la app)
pip install -r training/requirements.txt

# 2) Entrenar (ajusta train.py cuando tengas dataset)
python training/train.py
# -> genera training/output/model.h5

# 3) Convertir a TF.js (artefactos listos para la app)
tensorflowjs_converter --input_format keras ./training/output/model.h5 ./public/models/v1
# -> genera public/models/v1/model.json y shards .bin

# 4) (Opcional) Actualiza versión
cat public/models/v1/model-version.json
# { "version": "1.0", "type": "custom-detector", "url": "model.json", "updated": "2025-12-31" }
```

## 6) Integración en la app (carga post-login con caché y fallback)

Objetivo: cargar el modelo custom desde `public/models/v1/` (Vercel o Pages) después del login, cachearlo en IndexedDB y caer a COCO-SSD si algo falla.

Pasos recomendados:
1. Servir los archivos estáticos en producción (Vercel): `public/models/v1/model.json`, `.bin`, `model-version.json`.
2. Tras login, lanzar en background una verificación de versión:
   - Leer `localStorage.model_version`.
   - Pedir `/models/v1/model-version.json`.
   - Si la versión remota es mayor, descargar `model.json` y shards (se cachean en IndexedDB con `tf.loadGraphModel`).
   - Guardar `localStorage.model_version = versión_remota`.
3. Fallback: si falla la descarga o no hay versión, usar COCO-SSD.
4. No bloquear UI: mientras carga el modelo custom, usar el fallback; cuando termine, usar el custom.

Pseudocódigo de carga:
```ts
const VERSION_URL = '/models/v1/model-version.json';
const MODEL_URL = '/models/v1/model.json';

async function loadCustomModel() {
  const remote = await fetch(VERSION_URL).then(r => r.json());
  const localVersion = localStorage.getItem('model_version');

  // Si hay versión nueva, descargar y cachear
  if (remote.version !== localVersion) {
    try {
      const model = await tf.loadGraphModel(MODEL_URL); // cachea en IndexedDB
      await model.save('indexeddb://model_cache');
      localStorage.setItem('model_version', remote.version);
      return model;
    } catch (e) {
      console.warn('Fallo modelo custom, usando fallback', e);
    }
  }

  // Intentar cargar desde cache
  try {
    const cached = await tf.loadGraphModel('indexeddb://model_cache');
    return cached;
  } catch (_) {
    // Fallback final a COCO-SSD
    return cocoSsd.load();
  }
}
```

Notas:
- El tamaño (~7–10 MB) se descarga una sola vez y queda cacheado.
- Versiona por carpetas: `models/v1/`, `models/v2/` y actualiza `model-version.json` de cada versión.
- Si no hay modelo custom o falla la red, COCO-SSD mantiene la app funcionando.

## 6) Integrar en la app
- En `src/ml/regionDetector.ts`, cambia la carga a `tf.loadGraphModel(URL_DEL_MODEL_JSON)` cuando quieras usar tu modelo.
- Mantén fallback a COCO-SSD si falla la descarga para no romper la UX.
- Prueba en `/test-ocr` para comparar vs COCO-SSD.

## 7) Iterar con pocos datos
- Empieza con 20–30 ejemplos. No busques perfección; mide si mejora la caja respecto al fallback.
- Cuando consigas +20 ejemplos nuevos, re-entrena y publica v2 (v3, …).
- Versiona los modelos: `models/v1`, `models/v2`, etc. Ajusta `model-version.json` para que la app sepa cuál bajar.

## 8) Privacidad
- Todo el entrenamiento es offline con datos anonimizados.
- Nunca publiques imágenes reales; solo el modelo resultante.
- No necesitas backend: GitHub Pages sirve el modelo estático.

## 9) Checklist mínima para empezar
- [ ] Recolectar 20–50 comprobantes (anonimizados).
- [ ] Anotar cajas del número (clase `transfer_number`) en COCO.
- [ ] Entrenar SSD/MobileNet 5–10 epochs, guardar `model.h5`.
- [ ] Convertir a TF.js (`tensorflowjs_converter`).
- [ ] Subir a `public/models/v1/` y crear `model-version.json`.
- [ ] Ajustar loader en `regionDetector` para usar tu modelo (con fallback).
- [ ] Probar en `/test-ocr` y medir mejora vs COCO-SSD.

## 10) Recursos útiles
- COCO formato: https://cocodataset.org/#format-data
- TensorFlow.js converter: https://www.tensorflow.org/js/tutorials/conversion/import_keras
- Ejemplos de fine-tuning SSD/MobileNet en TF: revisa los tutoriales oficiales de Object Detection con TF 2.x.

