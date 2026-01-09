# Guía de Implementación - Sistema de Transferencias

## Resumen Ejecutivo

Se ha creado exitosamente una aplicación web PWA (Progressive Web App) para registrar transferencias bancarias de forma descentralizada usando Dropbox como almacenamiento.

### Decisión Técnica: Dropbox vs Google Drive

**Selección: Dropbox** ✅

**Razones:**

1. **Simplicidad de API**: Dropbox ofrece una API REST más directa para operaciones CRUD de archivos
2. **Autenticación**: OAuth 2.0 PKCE funciona perfectamente sin backend
3. **Orientación a archivos**: Diseñado para almacenar y gestionar archivos (no documentos colaborativos)
4. **Mantenibilidad**: Código más simple = más fácil de mantener por 1 desarrollador
5. **SDK JavaScript robusto**: Librería ligera y bien documentada
6. **Sin cuotas complejas**: Límites predecibles

**Google Drive sería mejor si:**
- Se necesitara colaboración en tiempo real
- Se requiriera integración con Google Workspace
- Se trabajara con documentos editables (Docs, Sheets)

---

## Arquitectura de la Solución

### Stack Tecnológico

```
Frontend:
├── React 18 (UI Library)
├── TypeScript (Type Safety)
├── Vite (Build Tool)
├── Chakra UI (Design System)
└── React Router (Routing)

PWA:
├── vite-plugin-pwa (Service Worker)
└── Workbox (Offline Caching)

Integraciones:
├── Dropbox SDK (Storage)
├── Tesseract.js (OCR)
└── date-fns (Date Handling)
```

### Patrón de Arquitectura: Atomic Design

```
src/
├── components/       # Moléculas - Componentes reutilizables
│   ├── ActionCard.tsx
│   ├── CameraView.tsx
│   └── InvoiceCard.tsx
│
├── modules/          # Organismos - (futuro: complejos)
│
├── pages/            # Templates - Páginas completas
│   ├── LoginPage.tsx
│   ├── HomePage.tsx
│   ├── UploadTransferPage.tsx
│   └── ReviewInvoicesPage.tsx
│
├── services/         # Servicios externos
│   └── dropbox.service.ts
│
├── hooks/            # Custom React Hooks
│   ├── useDropboxAuth.ts
│   └── useCamera.ts
│
├── utils/            # Utilidades
│   └── ocr.ts
│
├── theme.ts          # Design System
└── App.tsx           # Configuración de rutas
```

---

## Funcionalidades Implementadas

### 1. Autenticación con Dropbox

**Flujo:**
1. Usuario hace clic en "Conectar con Dropbox"
2. Redirección a Dropbox OAuth
3. Usuario autoriza la app
4. Callback con código de autorización
5. Intercambio de código por access token
6. Token guardado en localStorage

**Archivos:**
- `src/services/dropbox.service.ts` - Lógica de autenticación
- `src/hooks/useDropboxAuth.ts` - Hook para gestionar estado de auth
- `src/pages/LoginPage.tsx` - UI de login

### 2. Captura de Fotos

**Características:**
- Acceso a cámara del dispositivo
- Preview en tiempo real
- Captura en formato JPEG con 90% calidad
- Vista previa de foto capturada
- Opción de retomar foto

**Archivos:**
- `src/hooks/useCamera.ts` - Lógica de cámara
- `src/components/CameraView.tsx` - UI de cámara
- `src/pages/UploadTransferPage.tsx` - Flujo completo

### 3. Formulario de Datos

**Campos:**
- **Número de Factura** (requerido): Identificador único
- **Número de Transferencia** (opcional): Auto-detectado por OCR

**Validaciones:**
- Campo factura no puede estar vacío
- Feedback visual de errores

### 4. Subida a Dropbox

**Proceso:**
1. Subir imagen JPG a `/transferencias/transferencia_[factura]_[timestamp].jpg`
2. Generar enlace compartido
3. Leer o crear `/transferencias/facturas.csv`
4. Agregar nueva línea al CSV
5. Guardar CSV actualizado

**Estructura CSV:**
```csv
Fecha,Hora,Numero_Factura,Numero_Transferencia,Link_Imagen
2024-01-15,14:30:25,F001-123456,TRF-987654321,https://...
```

### 5. OCR (Detección Automática)

**Implementación:**
- Librería: Tesseract.js
- Idioma: Español
- Patrones detectados:
  1. "NÚMERO DE OPERACIÓN: 123456"
  2. "TRANSFERENCIA: ABC123"
  3. Números de 10+ dígitos

**Proceso:**
1. Foto capturada → Blob
2. Tesseract procesa imagen
3. Extrae texto completo
4. Busca patrones con regex
5. Rellena campo automáticamente

**Alertas de Duplicados:**
- Compara número extraído con CSV existente
- Toast de advertencia si ya existe
- Usuario puede continuar o cambiar

### 6. Revisión de Facturas

**Funcionalidades:**
- Lista de todas las facturas registradas
- Búsqueda en tiempo real por:
  - Número de factura
  - Número de transferencia
  - Fecha
- Tarjetas con información clave
- Enlace directo a imagen en Dropbox

**Archivos:**
- `src/pages/ReviewInvoicesPage.tsx`
- `src/components/InvoiceCard.tsx`

---

## Design System (Chakra UI)

### Paleta de Colores

```typescript
primary: Azul (#0894FF)     // Acciones principales
secondary: Gris azulado     // Elementos secundarios
success: Verde (#00C269)    // Estados exitosos
danger: Rojo (#FF1111)      // Errores y alertas
neutral: Grises             // Textos y fondos
```

### Componentes Personalizados

**Buttons:**
- Border radius: 12px
- Hover: Elevación + sombra
- Transiciones suaves (0.2s)

**Cards:**
- Border radius: 16px
- Box shadow: 0 4px 20px rgba(0,0,0,0.08)
- Hover: Sombra más prominente

### Responsive Design

```typescript
Breakpoints:
sm: 30em  (480px)
md: 48em  (768px)
lg: 62em  (992px)
xl: 80em  (1280px)
```

Mobile-first approach:
- Diseño base para móviles
- Mejoras progresivas para tablets/desktop

---

## Configuración Requerida

### 1. Crear App en Dropbox

**Pasos detallados:**

1. Ir a https://www.dropbox.com/developers/apps
2. Hacer clic en "Create app"
3. Seleccionar configuración:
   - **Choose an API**: Scoped access
   - **Choose the type of access**: Full Dropbox
   - **Name your app**: `contable-transferencias` (o cualquier nombre único)
4. En la pestaña "Settings":
   - **Redirect URIs**:
     - Desarrollo: `http://localhost:5173/login`
     - Producción: `https://transferidoya.com/login`
5. En la pestaña "Permissions":
   - Activar: `files.content.write`
   - Activar: `files.content.read`
   - Activar: `sharing.write` (para crear enlaces)
6. Copiar el **App key**

### 2. Configurar Variables de Entorno

Crear archivo `.env`:

```bash
VITE_DROPBOX_CLIENT_ID=tu_app_key_aqui
```

**Importante:**
- Este archivo NO debe commitearse a git
- Usar `.env.example` como referencia
- En producción, configurar en el hosting

### 3. Instalar y Ejecutar

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build producción
npm run build

# Preview build
npm run preview
```

---

## Flujo de Usuario

### Primer Uso

```
1. Usuario abre la app
   ↓
2. Ve pantalla de login
   ↓
3. Clic en "Conectar con Dropbox"
   ↓
4. Autoriza en Dropbox
   ↓
5. Redirección a home
```

### Registrar Transferencia

```
1. Home → "Subir Transferencia"
   ↓
2. Cámara se activa automáticamente
   ↓
3. Usuario centra comprobante y captura
   ↓
4. OCR procesa imagen (2-5 segundos)
   ↓
5. Número transferencia se rellena automáticamente
   ↓
6. Usuario ingresa número de factura
   ↓
7. Clic en "Guardar Transferencia"
   ↓
8. Foto → Dropbox + CSV actualizado
   ↓
9. Modal de éxito → Regreso a home
```

### Consultar Facturas

```
1. Home → "Revisar Facturas"
   ↓
2. Ve lista de facturas (más recientes primero)
   ↓
3. Usa búsqueda para filtrar
   ↓
4. Clic en "Ver comprobante" abre imagen en Dropbox
```

---

## Seguridad

### Datos del Usuario

- ✅ Sin backend: No hay servidor central que hackear
- ✅ Datos en Dropbox del usuario: Control total
- ✅ Access token en localStorage: Solo accesible desde mismo origen
- ✅ HTTPS en producción: Comunicación encriptada

### Buenas Prácticas

- No se exponen secretos en código frontend
- Client ID es público (esto es correcto en OAuth 2.0 PKCE)
- Token nunca se envía a terceros
- Dropbox maneja permisos y seguridad

---

## PWA (Progressive Web App)

### Características

- ✅ Manifest configurado
- ✅ Service Worker generado (Workbox)
- ✅ Cacheo de assets estáticos
- ✅ Instalable en dispositivos móviles

### Instalación Móvil

**Android:**
1. Abrir app en Chrome
2. Menú → "Agregar a pantalla de inicio"
3. Icono aparece en launcher

**iOS:**
1. Abrir app en Safari
2. Botón compartir
3. "Agregar a pantalla de inicio"

---

## Optimizaciones Futuras

### Corto Plazo
- [ ] Mejorar OCR con modelo entrenado para facturas
- [ ] Modo offline completo (guardar en IndexedDB y sincronizar después)
- [ ] Exportar CSV local

### Mediano Plazo
- [ ] Múltiples fotos por factura
- [ ] Editar/eliminar facturas
- [ ] Estadísticas y reportes
- [ ] Dark mode

### Largo Plazo
- [ ] Soporte para Google Drive (alternativa)
- [ ] Integración con sistemas contables (API)
- [ ] Multi-usuario con compartir carpetas

---

## Troubleshooting

### Error: "No se pudo acceder a la cámara"

**Causas:**
1. Permisos del navegador no otorgados
2. HTTPS no configurado (requerido en producción)
3. Dispositivo no tiene cámara

**Solución:**
1. Verificar permisos en configuración del navegador
2. Usar HTTPS en producción
3. Mostrar mensaje de error apropiado

### Error: "No se pudo guardar en Dropbox"

**Causas:**
1. Token expirado
2. Sin conexión a internet
3. Límite de espacio en Dropbox

**Solución:**
1. Re-autenticar (logout → login)
2. Verificar conexión
3. Liberar espacio en Dropbox

### OCR no detecta número

**Causas:**
1. Foto borrosa o mal iluminada
2. Formato no estándar
3. Texto muy pequeño

**Solución:**
1. Retomar foto con mejor calidad
2. Ingresar número manualmente (campo sigue siendo editable)

---

## Mantenimiento

### Actualizar Dependencias

```bash
# Verificar actualizaciones
npm outdated

# Actualizar todas (con cuidado)
npm update

# Actualizar major versions
npm install package@latest
```

### Monitoreo

- Revisar console del navegador para errores
- Verificar que CSV se genera correctamente
- Testear flujo completo mensualmente

### Backups

- Los datos están en Dropbox del usuario
- Recomendación: Exportar CSV periódicamente
- Usuario puede descargar carpeta `/transferencias/` completa

---

## Conclusión

Se ha desarrollado exitosamente una PWA completa, moderna y escalable para el registro de transferencias bancarias. La solución utiliza Dropbox como almacenamiento descentralizado, garantizando que cada usuario tenga control total sobre sus datos.

**Ventajas clave:**
- Sin infraestructura de servidor
- Fácil de mantener por un solo desarrollador
- Diseño mobile-first responsive
- OCR automático para mejorar UX
- PWA instalable

**Tech highlights:**
- React + TypeScript + Vite
- Chakra UI con design system personalizado
- Arquitectura Atomic Design
- OCR con Tesseract.js
- PWA con Service Workers

La app está lista para producción tras configurar el Dropbox App y las variables de entorno.
