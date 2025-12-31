# Inicio Rápido

## 🚀 5 Pasos para Comenzar

### 1. Crear App en Dropbox (5 minutos)

1. Ve a https://www.dropbox.com/developers/apps
2. Clic en "Create app"
3. Configuración:
   - API: **Scoped access**
   - Access: **Full Dropbox**
   - Name: `contable-transferencias` (o cualquier nombre)
4. En Settings:
   - Redirect URIs: `http://localhost:5173/login`
5. En Permissions:
   - ✅ `files.content.write`
   - ✅ `files.content.read`
   - ✅ `sharing.write`
6. **Copia el App key**

### 2. Configurar Variables de Entorno (30 segundos)

Crea archivo `.env` en la raíz del proyecto:

```bash
VITE_DROPBOX_CLIENT_ID=pega_aqui_tu_app_key
```

### 3. Instalar Dependencias (2 minutos)

```bash
npm install
```

### 4. Ejecutar (30 segundos)

```bash
npm run dev
```

Abre http://localhost:5173

### 5. Probar (2 minutos)

1. Clic en "Conectar con Dropbox"
2. Autoriza la app
3. Sube una transferencia
4. Revisa las facturas

## ✅ Listo

Tu app está funcionando localmente.

---

## 📱 Usar desde Móvil

### En la misma red WiFi:

1. Encuentra tu IP local:
   ```bash
   # Mac/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. Abre en el móvil:
   ```
   http://TU_IP:5173
   ```
   Ejemplo: `http://192.168.1.100:5173`

3. Actualiza Redirect URI en Dropbox:
   ```
   http://TU_IP:5173/login
   ```

---

## 🌐 Deploy a Producción

Ver [DEPLOY.md](./DEPLOY.md) para instrucciones completas.

**Opción más rápida: Vercel**

```bash
npm install -g vercel
vercel login
vercel
```

Configura variables de entorno en Vercel dashboard.

---

## 📚 Documentación Completa

- [README.md](./README.md) - Información general
- [GUIA_IMPLEMENTACION.md](./GUIA_IMPLEMENTACION.md) - Arquitectura detallada
- [DEPLOY.md](./DEPLOY.md) - Guía de deployment

---

## ⚠️ Solución de Problemas

### "No se pudo acceder a la cámara"

1. Verifica permisos del navegador
2. En producción, necesitas HTTPS

### "Error al conectar con Dropbox"

1. Verifica que el App key sea correcto en `.env`
2. Verifica que el Redirect URI coincida exactamente

### "Build falla"

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 🎯 Próximos Pasos

1. ✅ Configurar y probar localmente
2. 📸 Subir algunas transferencias de prueba
3. 🔍 Probar búsqueda y filtros
4. 🚀 Deploy a producción (cuando estés listo)
5. 📱 Instalar PWA en móvil

---

## 💡 Tips

- **OCR**: Toma fotos con buena iluminación para mejor detección
- **Duplicados**: El sistema te alertará si detecta un número repetido
- **Búsqueda**: Puedes buscar por factura, transferencia o fecha
- **Offline**: Próximamente se agregará soporte completo offline
- **CSV**: Puedes descargar el archivo `facturas.csv` desde Dropbox

---

¿Dudas? Revisa la documentación completa en los archivos markdown del proyecto.
