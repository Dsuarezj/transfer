# Guía de Deploy

## Opciones de Hosting

### 1. Vercel (Recomendado) ⭐

**Ventajas:**
- Deploy automático desde Git
- HTTPS gratis
- CDN global
- Zero configuration para Vite
- Gratis para proyectos personales

**Pasos:**

1. Subir código a GitHub/GitLab/Bitbucket

2. Ir a [vercel.com](https://vercel.com)

3. Importar proyecto:
   ```
   New Project → Import Git Repository
   ```

4. Configurar variables de entorno:
   ```
   VITE_DROPBOX_CLIENT_ID=tu_app_key
   ```

5. Configurar Redirect URI en Dropbox:
   ```
   https://tu-proyecto.vercel.app/login
   ```

6. Deploy automático en cada push a main

**Comandos locales:**
```bash
npm install -g vercel
vercel login
vercel
```

---

### 2. Netlify

**Ventajas:**
- Similar a Vercel
- Formularios integrados
- Functions serverless
- Gratis para proyectos personales

**Pasos:**

1. Subir código a GitHub

2. Ir a [netlify.com](https://netlify.com)

3. New site from Git

4. Configurar build:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

5. Variables de entorno:
   ```
   VITE_DROPBOX_CLIENT_ID=tu_app_key
   ```

6. Actualizar Redirect URI en Dropbox

---

### 3. GitHub Pages

**Ventajas:**
- Gratis
- Integrado con GitHub
- Simple para proyectos estáticos

**Limitación:**
- Rutas requieren configuración especial (SPA)

**Pasos:**

1. Instalar gh-pages:
   ```bash
   npm install -D gh-pages
   ```

2. Agregar en `package.json`:
   ```json
   {
     "homepage": "https://usuario.github.io/repo-name",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. Actualizar `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/repo-name/',
     // ... resto config
   });
   ```

4. Deploy:
   ```bash
   npm run deploy
   ```

5. Configurar en GitHub:
   ```
   Settings → Pages → Source: gh-pages branch
   ```

---

### 4. Firebase Hosting

**Ventajas:**
- Rápido y confiable
- CDN global
- Gratis (con límites generosos)

**Pasos:**

1. Instalar Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login:
   ```bash
   firebase login
   ```

3. Inicializar:
   ```bash
   firebase init hosting
   ```

   Seleccionar:
   - Public directory: `dist`
   - Single-page app: `Yes`
   - GitHub deployment: `No`

4. Build:
   ```bash
   npm run build
   ```

5. Deploy:
   ```bash
   firebase deploy
   ```

---

## Configuración Pre-Deploy

### 1. Variables de Entorno

Asegurarse que todas las plataformas tengan:

```bash
VITE_DROPBOX_CLIENT_ID=tu_app_key_de_dropbox
```

### 2. Dropbox Redirect URIs

En [Dropbox App Console](https://www.dropbox.com/developers/apps), agregar:

```
Desarrollo:
http://localhost:5173/login

Producción:
https://tu-dominio.com/login
```

### 3. Build Local

Probar build antes de deploy:

```bash
npm run build
npm run preview
```

Verificar que funcione en `http://localhost:4173`

---

## Optimizaciones de Producción

### 1. Comprimir Assets

Ya incluido en Vite, pero puedes mejorar:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Quitar console.logs
      },
    },
  },
});
```

### 2. Lazy Loading

Para mejorar tiempo de carga inicial:

```typescript
// App.tsx
import { lazy, Suspense } from 'react';

const UploadTransferPage = lazy(() => import('./pages/UploadTransferPage'));
const ReviewInvoicesPage = lazy(() => import('./pages/ReviewInvoicesPage'));

// Envolver en Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/upload" element={<UploadTransferPage />} />
  </Routes>
</Suspense>
```

### 3. Chunking Manual

Para mejorar cacheo:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@chakra-ui/react', '@emotion/react'],
          dropbox: ['dropbox'],
          ocr: ['tesseract.js'],
        },
      },
    },
  },
});
```

---

## PWA en Producción

### 1. Verificar Service Worker

Después del deploy, verificar en Chrome DevTools:

```
Application → Service Workers
```

Debe aparecer activo.

### 2. Manifest

Verificar:
```
Application → Manifest
```

Debe tener:
- Nombre
- Iconos
- Theme color
- Start URL

### 3. Lighthouse Score

Ejecutar audit:
```
DevTools → Lighthouse → Generate report
```

Objetivo:
- Performance: 90+
- PWA: 100
- Accessibility: 90+

---

## CI/CD Automático

### GitHub Actions (Ejemplo para Vercel)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_DROPBOX_CLIENT_ID: ${{ secrets.VITE_DROPBOX_CLIENT_ID }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## Monitoreo Post-Deploy

### 1. Error Tracking

Considerar integrar:
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay

### 2. Analytics

Opciones:
- Google Analytics
- Plausible (privacy-friendly)
- Fathom

### 3. Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com)
- [Pingdom](https://pingdom.com)

---

## Checklist Pre-Deploy ✅

- [ ] Variables de entorno configuradas
- [ ] Redirect URIs en Dropbox actualizados
- [ ] Build local exitoso
- [ ] Preview local funciona correctamente
- [ ] Cámara funciona en HTTPS
- [ ] OCR se procesa correctamente
- [ ] Dropbox upload funciona
- [ ] CSV se genera bien
- [ ] PWA manifest configurado
- [ ] Service Worker activo
- [ ] README actualizado con URL producción

---

## Troubleshooting Deploy

### Error: "Module not found"

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: Cámara no funciona en producción

**Causa:** No hay HTTPS

**Solución:**
- Todos los hostings recomendados tienen HTTPS automático
- Verificar que URL sea `https://` no `http://`

### Error: Dropbox redirect mismatch

**Solución:**
1. Ir a Dropbox App Console
2. Settings → Redirect URIs
3. Agregar URL exacta: `https://tu-dominio.com/login`
4. Guardar cambios

### Build size muy grande

**Solución:**
Ver optimizaciones arriba, especialmente:
- Manual chunks
- Lazy loading
- Tree shaking (automático en Vite)

---

## Dominio Personalizado

### Vercel

1. Comprar dominio (Namecheap, GoDaddy, etc.)

2. En Vercel:
   ```
   Project Settings → Domains → Add Domain
   ```

3. Configurar DNS:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. Actualizar Redirect URI en Dropbox

### Netlify

Similar a Vercel, con DNS específicos de Netlify.

---

## Costos Estimados

### Gratis:
- Hosting (Vercel/Netlify)
- SSL/HTTPS
- CDN
- Dropbox (5GB gratis)

### Opcional:
- Dominio personalizado: ~$10-15/año
- Dropbox Plus (2TB): $9.99/mes
- Monitoring/Analytics: Gratis a ~$10/mes

---

## Contacto y Soporte

Para problemas de deploy:
1. Revisar logs de la plataforma
2. Verificar variables de entorno
3. Testear build local primero
4. Revisar documentación de plataforma específica

¡Deploy exitoso! 🚀
