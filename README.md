# Transferido

Aplicación web PWA para registrar transferencias bancarias con total privacidad usando Dropbox como almacenamiento.

## Características

- 📸 Captura de fotos de comprobantes de transferencia
- 🤖 Detección automática de números de transferencia con OCR
- ⚠️ Alertas de transferencias duplicadas
- 📊 Visualización y búsqueda de facturas registradas
- 🔒 Almacenamiento seguro en tu propio Dropbox
- 📱 Diseño responsive mobile-first
- 💾 Funciona como PWA (Progressive Web App)

## Arquitectura

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Chakra UI con diseño personalizado
- **Almacenamiento**: Dropbox API
- **OCR**: Tesseract.js para extracción de texto
- **PWA**: vite-plugin-pwa

### Estructura de Carpetas (Atomic Design)

```
src/
├── components/     # Componentes reutilizables (moléculas)
├── modules/        # Módulos complejos (organismos)
├── pages/          # Páginas de la aplicación
├── services/       # Servicios externos (Dropbox)
├── hooks/          # Custom React hooks
├── utils/          # Utilidades y helpers
└── theme.ts        # Design system y tema
```

## Configuración

### 1. Crear Aplicación en Dropbox

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Haz clic en "Create app"
3. Selecciona:
   - **API**: Scoped access
   - **Access**: Full Dropbox
   - **Name**: Elige un nombre único
4. En la configuración de la app:
   - **Redirect URIs**: Agrega `http://localhost:5173/login` (desarrollo) y tu URL de producción
   - **Permissions**: Activa `files.content.write` y `files.content.read`
5. Copia el **App key**

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
VITE_DROPBOX_CLIENT_ID=tu_app_key_aqui
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 5. Build para Producción

```bash
npm run build
```

Los archivos se generarán en la carpeta `dist/`

## Uso

### Primera vez

1. Abre la aplicación
2. Haz clic en "Conectar con Dropbox"
3. Autoriza el acceso a tu Dropbox
4. Ya puedes comenzar a registrar transferencias

### Subir Transferencia

1. En la pantalla principal, selecciona "Subir Transferencia"
2. Toma una foto del comprobante
3. El sistema intentará detectar automáticamente el número de transferencia
4. Ingresa el número de factura (requerido)
5. Guarda la transferencia

### Revisar Facturas

1. Selecciona "Revisar Facturas"
2. Usa el buscador para filtrar por:
   - Número de factura
   - Número de transferencia
   - Fecha
3. Haz clic en "Ver comprobante" para abrir la imagen en Dropbox

## Estructura de Datos en Dropbox

La aplicación crea una carpeta `/transferencias/` en tu Dropbox con:

```
/transferencias/
├── facturas.csv              # Registro de todas las facturas
├── transferencia_F001_*.jpg  # Imágenes de comprobantes
└── ...
```

El archivo CSV contiene:
- Fecha
- Hora
- Número de Factura
- Número de Transferencia (si se detecta)
- Link a la imagen en Dropbox

## Tecnologías

- **React 18**: Framework de UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server
- **Chakra UI**: Sistema de diseño y componentes
- **Dropbox SDK**: Integración con Dropbox
- **Tesseract.js**: OCR para detección de texto
- **React Router**: Navegación
- **date-fns**: Manejo de fechas
- **Framer Motion**: Animaciones (incluido en Chakra UI)

## PWA

La aplicación funciona como PWA y puede ser instalada en dispositivos móviles:

- Android: "Agregar a pantalla de inicio"
- iOS: "Agregar a la pantalla de inicio"

## Ventajas de Transferido

- ✅ **Privacidad total**: Tus datos solo están en tu Dropbox, nadie más puede verlos
- ✅ **Control completo**: Tú decides qué hacer con tus datos
- ✅ **Sin servidor central**: No dependes de servicios de terceros
- ✅ **Seguro**: Dropbox protege tus archivos
- ✅ **Económico**: Sin costos de hosting de datos
- ✅ **Simple**: Fácil de usar desde cualquier dispositivo

## Privacidad y Seguridad

- Tus credenciales se guardan solo en tu navegador
- Todos los datos se almacenan únicamente en tu Dropbox personal
- La app no envía información a ningún servidor externo
- Solo tú tienes acceso a las imágenes y registros
- Nadie más puede ver tus transferencias

## Mejoras Futuras

- [ ] Soporte offline con Service Workers
- [ ] Exportar reportes en Excel
- [ ] Múltiples fotos por factura
- [ ] Mejora de OCR con modelos específicos para facturas
- [ ] Sincronización con otros servicios (Google Drive)
- [ ] Dark mode

## Licencia

Proyecto privado para uso interno.
