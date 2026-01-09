# Configurar Dominio transferidoya.com en Vercel

## Paso 1: Agregar Dominio en Vercel

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto "transfer" (o el nombre que tenga)
3. Ve a **Settings** → **Domains**
4. Haz clic en **Add Domain**
5. Ingresa: `transferidoya.com`
6. Haz clic en **Add**

Vercel te mostrará las instrucciones de DNS que necesitas configurar.

## Paso 2: Configurar DNS en Namecheap

### Opción A: Usar los nameservers de Vercel (Recomendado)

1. En Vercel, después de agregar el dominio, verás los nameservers
2. Ve a [Namecheap Domain List](https://ap.www.namecheap.com/domains/list/)
3. Haz clic en **Manage** junto a `transferidoya.com`
4. Ve a la sección **Nameservers**
5. Selecciona **Custom DNS**
6. Ingresa los nameservers que Vercel te proporcionó (generalmente algo como):
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
7. Guarda los cambios

### Opción B: Configurar registros DNS manualmente (Alternativa)

Si prefieres mantener los nameservers de Namecheap:

1. En Namecheap, ve a **Advanced DNS**
2. Agrega estos registros:

   **Para el dominio raíz (transferidoya.com):**
   ```
   Type: A Record
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   ```

   **Para www (www.transferidoya.com):**
   ```
   Type: CNAME Record
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```

   **O usa los valores que Vercel te indique** (pueden variar)

## Paso 3: Verificar Configuración

1. Espera 5-10 minutos para que los cambios de DNS se propaguen
2. En Vercel, verifica que el dominio muestre "Valid Configuration" ✅
3. Prueba acceder a:
   - `https://transferidoya.com`
   - `https://www.transferidoya.com`

## Paso 4: Actualizar Dropbox Redirect URIs

Una vez que el dominio esté funcionando:

1. Ve a [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Selecciona tu app
3. Ve a **Settings** → **OAuth 2**
4. En **Redirect URIs**, asegúrate de tener:
   ```
   Desarrollo:
   http://localhost:5173/login
   
   Producción:
   https://transferidoya.com/login
   https://www.transferidoya.com/login
   ```
5. Guarda los cambios

## Paso 5: Verificar Variables de Entorno en Vercel

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Verifica que tengas:
   ```
   VITE_DROPBOX_CLIENT_ID=tu_app_key_aqui
   ```
3. Si no está, agrégalo y haz redeploy

## Paso 6: Forzar HTTPS (Automático en Vercel)

Vercel configura HTTPS automáticamente con Let's Encrypt. No necesitas hacer nada adicional.

## Troubleshooting

### El dominio no carga después de 30 minutos

1. Verifica los nameservers/DNS en Namecheap
2. Usa [whatsmydns.net](https://www.whatsmydns.net) para verificar la propagación
3. Revisa los logs en Vercel para ver si hay errores

### Error de SSL/HTTPS

- Vercel configura SSL automáticamente, pero puede tardar hasta 24 horas
- Si después de 24 horas no funciona, contacta a Vercel support

### El dominio carga pero la app no funciona

1. Verifica que las variables de entorno estén configuradas
2. Verifica que los Redirect URIs en Dropbox coincidan exactamente
3. Revisa la consola del navegador para errores

## Checklist Final ✅

- [ ] Dominio agregado en Vercel
- [ ] DNS configurado en Namecheap
- [ ] Dominio muestra "Valid Configuration" en Vercel
- [ ] `https://transferidoya.com` carga correctamente
- [ ] `https://www.transferidoya.com` redirige correctamente
- [ ] Redirect URIs actualizados en Dropbox
- [ ] Variables de entorno configuradas en Vercel
- [ ] La app funciona correctamente en producción

