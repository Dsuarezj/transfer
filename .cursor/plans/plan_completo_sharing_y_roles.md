---
name: Plan Completo - Sharing y Gestión de Roles (Optimizado)
overview: Implementar sistema completo de compartir carpetas, gestión de empleados, roles (admin/employee) basados en acceso real de Dropbox. Estrategia optimizada con cache para UX y verificación real solo en recursos protegidos.
todos: []
---

# Plan Completo - Sharing y Gestión de Roles (Optimizado)

## Objetivo
Implementar sistema completo donde múltiples usuarios pueden trabajar en la misma empresa, con roles diferenciados (admin/employee) determinados por acceso real a carpetas en Dropbox. Optimizado para performance con cache de roles y verificación real solo cuando es necesario.

## Estrategia de Seguridad para Roles

### Principios de Seguridad

1. **Lista de miembros**: Se obtiene directamente de Dropbox Sharing API, NO se guarda en JSON
2. **Roles basados en acceso real**: No hay JSON/arrays de roles. Los roles se determinan por el acceso real a las carpetas
3. **Verificación de roles**: 
   - Si usuario tiene acceso a carpeta principal `/transferencias-empresa/` → es admin
   - Si solo tiene acceso a `/transferencias-empresa/workspace-empresa/` → es employee
   - NO se usa JSON para verificar roles (solo para metadata básica)

### Estructura de Carpetas y Permisos

```
/transferencias-empresa/                    (carpeta principal - compartir con ADMINS)
  ├── .empresa.json                         (solo metadata básica, NO para seguridad)
  ├── workspace-empresa/                     (compartir con EMPLOYEES)
  │   ├── capturas/
  │   └── reportes/
  └── config/                               (solo admins - acceso por herencia)
```

**Características:**
- Carpeta principal mantiene patrón `transferencias-empresa` (para detección de owner)
- Subcarpeta `workspace-empresa/` para compartir con employees
- Patrón `workspace-*` para detectar si usuario está asignado a empresa
- Carpetas agrupadas dentro de la carpeta principal
- Fácil identificar qué compartir
- Employees detectan empresa desde `workspace-empresa/` compartida

### Flujo de Invitación

**Invitar como Admin:**
1. Verificar que el usuario actual es admin (tiene acceso a carpeta principal)
2. Compartir `/transferencias-empresa/` (carpeta principal) con el nuevo usuario
3. El usuario automáticamente tiene acceso a `config/` por herencia
4. Listo - el usuario es admin

**Invitar como Employee:**
1. Verificar que el usuario actual es admin
2. Compartir `/transferencias-empresa/workspace-empresa/` con el nuevo usuario
3. NO compartir la carpeta principal
4. Listo - el usuario es employee (solo ve workspace)

### Verificación de Rol

**Para verificar si usuario es admin:**
1. Intentar obtener metadata de carpeta principal `/transferencias-empresa/`
2. Verificar que está compartida explícitamente usando `sharingListFolderMembers`
3. Si tiene acceso → es admin
4. Si NO tiene acceso → verificar acceso a `workspace-empresa/`
5. Si tiene acceso a workspace → es employee
6. Si no tiene acceso a nada → null

**Ventajas de este enfoque:**
- ✅ **Más simple**: No hay JSON que mantener para seguridad
- ✅ **Más seguro**: Dropbox es la única fuente de verdad
- ✅ **Más directo**: El acceso real determina el rol
- ✅ **Sin estado intermedio**: No hay riesgo de desincronización
- ✅ **Menos código**: No hay que leer/escribir `.roles.json`

## Estrategia de Verificación Optimizada

### 1. Sistema de Storage Genérico (Inversión de Control)

**Crear `src/utils/storageService.ts`:**

Sistema genérico que reutiliza la lógica de localStorage existente en el proyecto. El consumidor pasa funciones de serialización/deserialización directamente (inversión de control simple).

```typescript
class StorageService {
  static get<T>(
    key: string,
    deserialize: (data: string) => T | null
  ): T | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return deserialize(data);
    } catch {
      return null;
    }
  }

  static set<T>(
    key: string,
    value: T,
    serialize: (value: T) => string
  ): void {
    const serialized = serialize(value);
    localStorage.setItem(key, serialized);
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}
```

**Uso (ejemplos):**
```typescript
import { STORAGE_KEYS, getRoleCacheKey } from '../constants/storageKeys';

// Cache de rol
const role = StorageService.get(
  getRoleCacheKey(companyId),
  (data) => data === '' ? null : data as 'admin' | 'employee' | null
);

StorageService.set(
  getRoleCacheKey(companyId),
  'admin',
  (role) => role || ''
);

// Cache de empresas (con timestamp)
const companies = StorageService.get(
  STORAGE_KEYS.COMPANIES_CACHE,
  (data) => JSON.parse(data) as { companies: Company[], timestamp: number }
);

StorageService.set(
  STORAGE_KEYS.COMPANIES_CACHE,
  { companies, timestamp: Date.now() },
  (data) => JSON.stringify(data)
);
```

**Ventajas:**
- ✅ Reutiliza lógica de localStorage existente en el proyecto
- ✅ Inversión de control: el consumidor pasa funciones directamente
- ✅ Más simple que objetos estrategia
- ✅ Sin duplicación de código
- ✅ Type-safe con TypeScript
- ✅ Fácil de testear

**Importante:** El cache es solo para UX, NO para seguridad.

### 2. Verificación Real Solo en Recursos Protegidos

**Solo verificar cuando:**
- Usuario intenta acceder a `/company/members` (pantalla de admin)
- Usuario intenta invitar/remover/cambiar rol
- Cualquier operación de administración

**NO verificar en:**
- Subir transferencias (todos pueden)
- Ver transferencias (todos pueden)
- Revisar reportes (todos pueden)
- Cualquier otra feature normal

### 3. Quién Puede Invitar

**Admins pueden invitar:**
- Cualquier usuario con acceso a la carpeta principal puede invitar
- No depende de ser owner
- Dropbox permite compartir carpetas compartidas si tienes permisos de edición

## Optimizaciones y Simplificaciones Aplicadas

### 1. Sistema de Storage Genérico (Inversión de Control)
- ✅ Un solo método genérico `StorageService` que reutiliza lógica de localStorage existente
- ✅ El consumidor pasa funciones de serialización/deserialización directamente
- ✅ Más simple que objetos estrategia
- ✅ Elimina duplicación de código de localStorage
- ✅ Type-safe y fácil de usar

### 2. Optimización de `getCompanyMembers()`
- ✅ Solo 2 llamadas API: carpeta principal + workspace
- ✅ Cálculo de roles por diferencia de conjuntos (no verificación individual)
- ✅ Mucho más rápido con muchos miembros

### 3. Eliminación de Métodos No Usados
- ✅ Eliminado `isCompanyOwner()` (no se usa en el flujo)
- ✅ Eliminado `initializeCompanyRole()` (inicialización automática)
- ✅ Eliminadas funciones específicas de cache (usar `StorageService` genérico)

### 4. Verificación de Roles Optimizada
- ✅ Verificación en paralelo usando `Promise.allSettled()`
- ✅ Más rápido que verificación secuencial

### 5. Detección de Empresas Optimizada
- ✅ `ensureActiveCompany()`: Solo detecta si NO hay empresa activa
- ✅ `switchActiveCompany()`: Solo se llama cuando usuario cambia empresa en hamburguesa
- ✅ Cache de empresas detectadas con timestamp (5 minutos TTL)
- ✅ HomePage: No hace llamadas API si ya tiene empresa activa
- ✅ Búsqueda en paralelo de carpetas propias y compartidas
- ✅ Inferencia directa desde workspace sin buscar carpeta principal si no es necesario
- ✅ **Evita llamadas repetidas cuando ya tenemos la información**

### 6. Simplificación de Operaciones
- ✅ `removeMember()`: Intentar remover de ambas carpetas (sin verificar rol primero)
- ✅ `updateMemberRole()`: Cambiar directamente según nuevo rol (sin verificar actual)

### 7. Centralización de Constantes
- ✅ `WORKSPACE_FOLDER_PREFIX` agregado a `constants/dropbox.ts`
- ✅ Todas las constantes de prefijos en un solo lugar

### 8. Servicios Consolidados
- ✅ Funciones de sharing integradas en `companyService` (funciones internas)
- ✅ `roleService` con solo 2 funciones esenciales
- ✅ No hay `permissionService` separado

### 9. UI Consolidada
- ✅ Una sola página `CompanyMembersPage.tsx` para invitar y gestionar miembros
- ✅ No hay componente separado `CompanyMembersList`

### 10. Validación Simplificada
- ✅ No modificar `fileService` - Dropbox maneja la seguridad
- ✅ Validación solo en pantalla de admin y operaciones críticas

### 11. Sin Sincronización
- ✅ Siempre leer desde Dropbox API cuando se necesite
- ✅ No hay estado que mantener sincronizado

### 12. Eliminación de Fase Redundante
- ✅ Eliminada Fase 8 (ya cubierta en Fase 4)

## Fase 0: Sistema de Storage Genérico

### 0.1 Actualizar `src/constants/storageKeys.ts`

**Agregar nuevas keys necesarias para roles y cache:**

```typescript
export const STORAGE_KEYS = {
  DROPBOX_ACCESS_TOKEN: 'dropbox_access_token',
  DROPBOX_REFRESH_TOKEN: 'dropbox_refresh_token',
  DROPBOX_EXPIRES_AT: 'dropbox_expires_at',
  DROPBOX_CODE_VERIFIER: 'dropbox_code_verifier',
  ACTIVE_COMPANY: 'active_company',
  COMPANIES_CACHE: 'companies_cache',
  // Nuevas keys para roles
  ROLE_CACHE_PREFIX: 'role_', // Se usará como `role_${companyId}`
} as const;

// Helper para generar key de rol
export function getRoleCacheKey(companyId: string): string {
  return `${STORAGE_KEYS.ROLE_CACHE_PREFIX}${companyId}`;
}
```

**Ventajas:**
- ✅ Todas las keys centralizadas en un solo lugar
- ✅ Sin magic strings en el código
- ✅ Type-safe con TypeScript
- ✅ Fácil de mantener y refactorizar

### 0.2 Crear `src/utils/storageService.ts`

**Implementar sistema genérico que reutiliza lógica de localStorage existente:**

```typescript
class StorageService {
  static get<T>(
    key: string,
    deserialize: (data: string) => T | null
  ): T | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    try {
      return deserialize(data);
    } catch {
      return null;
    }
  }

  static set<T>(
    key: string,
    value: T,
    serialize: (value: T) => string
  ): void {
    const serialized = serialize(value);
    localStorage.setItem(key, serialized);
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }
}
```

**Ventajas:**
- ✅ Reutiliza lógica de localStorage que ya existe en el proyecto
- ✅ Inversión de control: el consumidor pasa funciones directamente
- ✅ Más simple que objetos estrategia
- ✅ Sin duplicación de código
- ✅ Type-safe con TypeScript
- ✅ Usa `STORAGE_KEYS` para evitar magic strings

### 0.2 Migrar código existente a usar `StorageService` y `STORAGE_KEYS`

**Actualizar:**
- `companyService.ts`: 
  - Usar `StorageService` para cache de empresas y empresa activa
  - Reemplazar strings mágicos por `STORAGE_KEYS.ACTIVE_COMPANY` y `STORAGE_KEYS.COMPANIES_CACHE`
- `roleService.ts`: 
  - Usar `StorageService` para cache de roles
  - Usar `getRoleCacheKey(companyId)` en lugar de strings mágicos
- Mantener compatibilidad con código existente durante migración
- **Todas las keys deben venir de `STORAGE_KEYS`** - no magic strings

### 0.3 Tests: `src/utils/storageService.test.ts`
- Test para `get()` con función de deserialización válida
- Test para `get()` cuando no hay datos
- Test para `set()` y `get()` roundtrip
- Test para `remove()`
- Test para manejo de errores en deserialización
- Test para diferentes tipos de datos (string, number, object, etc.)

## Fase 1: Funciones de Sharing (Integradas en companyService)

### 1.1 Agregar funciones a `src/services/company/companyService.ts`

**Funciones internas (privadas) a agregar:**
- `shareFolder(folderPath: string, email: string): Promise<void>`
  - Función helper para compartir carpeta usando Dropbox Sharing API
  - Usa `sharingShareFolder` o `sharingAddFolderMember`
  
- `removeFolderAccess(folderPath: string, accountId: string): Promise<void>`
  - Función helper para remover acceso usando `sharingRemoveFolderMember`

- `getFolderMembers(folderId: string): Promise<any[]>`
  - Función helper para obtener miembros usando `sharingListFolderMembers`

**Funciones públicas que usarán estas helpers:**
- `addMember(companyId: string, email: string, role: 'admin' | 'employee'): Promise<CompanyMember>`
  - Si rol es 'admin': compartir carpeta principal `/transferencias-empresa/`
  - Si rol es 'employee': compartir solo `/transferencias-empresa/workspace-empresa/`
  - Obtiene `accountId` del usuario invitado desde Dropbox API
  - Actualiza cache de rol después de invitar
  
- `removeMember(companyId: string, accountId: string): Promise<void>`
  - **Simplificado**: Intentar remover de ambas carpetas (principal y workspace)
  - Dropbox falla silenciosamente si no tiene acceso, no es necesario verificar rol primero
  - Limpiar cache de rol del miembro removido
  
- `updateMemberRole(companyId: string, accountId: string, newRole: 'admin' | 'employee'): Promise<void>`
  - **Simplificado**: Cambiar directamente según nuevo rol
  - Si nuevo rol es 'admin': compartir carpeta principal, remover de workspace
  - Si nuevo rol es 'employee': remover de carpeta principal, compartir workspace
  - **No verifica rol actual** - cambia directamente según nuevo rol
  - Actualizar cache de rol después de cambio
  
- `getCompanyMembers(companyId: string): Promise<CompanyMember[]>`
  - **Implementación optimizada:**
  1. Obtener empresa activa para tener `folderPath` y `folderId`
  2. Obtener miembros de carpeta principal usando `sharingListFolderMembers` (primera llamada API)
  3. Obtener miembros de workspace usando `sharingListFolderMembers` (segunda llamada API)
  4. Calcular roles por diferencia de conjuntos:
     - Crear Set de `accountId` de miembros de carpeta principal
     - Miembros en carpeta principal → rol 'admin'
     - Miembros solo en workspace (no en Set de principal) → rol 'employee'
  5. Combinar y retornar lista completa con roles calculados
  - **Solo 2 llamadas API** independientemente del número de miembros
  - **No verifica rol individualmente** - usa operación de conjuntos (O(1) lookup)

**Consideraciones:**
- Funciones internas sin prefijo `_` (según preferencia del usuario)
- Todo relacionado con empresas en un solo servicio
- Menos imports y dependencias

### 1.2 Tests: Actualizar `src/services/company/companyService.test.ts`
- Tests para nuevas funciones de sharing integradas
- Tests para manejar errores (email no existe, ya es miembro, etc.)
- Tests para `getCompanyMembers()` optimizado:
  - Verificar que solo hace 2 llamadas API
  - Verificar cálculo correcto de roles por diferencia de conjuntos
  - Test con múltiples miembros (admins y employees)
  - Test con solo admins
  - Test con solo employees

## Fase 2: Servicio de Roles (Simplificado)

### 2.1 Crear `src/services/roles/roleService.ts`

**Solo 2 funciones esenciales (eliminadas funciones no usadas):**
- `getUserRole(companyId: string, accountId?: string): Promise<'admin' | 'employee' | null>`
  - Si no se pasa `accountId`, usa el usuario actual
  - **Optimizado**: Verifica acceso en paralelo usando `Promise.allSettled()`:
    - Intenta obtener metadata de carpeta principal `/transferencias-empresa/`
    - Intenta obtener metadata de workspace `/transferencias-empresa/workspace-empresa/`
  - Si tiene acceso a carpeta principal → retorna 'admin'
  - Si solo tiene acceso a workspace → retorna 'employee'
  - Si no tiene acceso a nada → retorna null
  - **Más rápido**: Verificación en paralelo vs secuencial
  
- `requireAdmin(companyId: string): Promise<void>`
  - Verifica `getUserRole()` con verificación real (no cache)
  - Lanza error si usuario no es admin
  - Útil para proteger funciones críticas

**NO hay archivos JSON para seguridad** - Todo se determina por acceso real a Dropbox.

**Cache:**
- Usar `StorageService` genérico para cache de rol
- No hay funciones específicas de cache en `roleService` - usar servicio genérico
- Usar `getRoleCacheKey(companyId)` de `storageKeys.ts` para obtener la key
- Ejemplo: `StorageService.get(getRoleCacheKey(companyId), (data) => data === '' ? null : data as 'admin' | 'employee' | null)`

### 2.3 Tests: `src/services/roles/roleService.test.ts`
- Test para `getUserRole()` - admin (tiene acceso a carpeta principal)
- Test para `getUserRole()` - employee (solo tiene acceso a workspace)
- Test para `getUserRole()` - null (no tiene acceso)
- Test para `getUserRole()` - verificación en paralelo (Promise.allSettled)
- Test para `requireAdmin()` - lanza error si no es admin
- Tests para `StorageService` genérico (en archivo separado `storageService.test.ts`)

## Fase 3: Extender companyService

### 3.1 Actualizar funciones existentes

**Actualizar `saveCompanyMetadata` y `getCompanyMetadata`:**
- `.empresa.json` NO debe incluir `members[]` (se obtiene de Dropbox API)
- Mantener solo: `id`, `name`, `folderPath`, `folderId`, `createdAt`, `ownerEmail`, `ownerAccountId`
- Validar estructura de metadata al leer

**Actualizar `createCompany`:**
- Crear carpeta principal con patrón `transferencias-{nombre}` (mantener patrón actual)
- Crear estructura: carpeta principal, `workspace-{nombre}/`, `config/`
- Crear subcarpetas dentro de workspace: `capturas/`, `reportes/`
- Inicializar y cachear rol automáticamente después de crear empresa (usar `roleService.getUserRole()` y `StorageService` con `getRoleCacheKey()`)

**Nota:** No hay función separada `initializeCompanyRole()` - la inicialización se hace automáticamente al detectar/crear empresa

### 3.2 Tests: Actualizar `src/services/company/companyService.test.ts`
- Tests para nuevas funciones de gestión de miembros
- Tests para inicialización de rol y cache

## Fase 4: Detección de Empresas Optimizada

### 4.1 Optimizar detección para evitar llamadas innecesarias

**Principios:**
- **HomePage**: Solo detecta si NO tiene empresa activa en localStorage
- **Si ya tiene empresa activa**: No hace nada, usa la información cacheada
- **Cambio de empresa en hamburguesa**: Solo entonces se hace nueva detección
- **Cache de empresas**: Verificar cache antes de llamar API

**Agregar a `companyService`:**
- `ensureActiveCompany(): Promise<{ action: 'redirect' | 'none', company?: Company }>`
  - Verifica si hay empresa activa en localStorage
  - Si existe y está en cache → retorna `{ action: 'none', company }` (no hace nada)
  - Si NO existe → detecta empresas
  - Si hay 0 empresas → retorna `{ action: 'redirect' }` (redirigir a crear)
  - Si hay 1+ empresas → establece primera como activa, retorna `{ action: 'none', company }`
  - **Solo hace llamadas API cuando es necesario**

- `switchActiveCompany(companyId: string): Promise<Company>`
  - Función para cambiar empresa desde hamburguesa
  - Verifica que la empresa existe en cache o detecta de nuevo
  - Establece como activa
  - Inicializa y cachea rol
  - Retorna empresa activa

### 4.2 Actualizar `detectCompanies()` en `companyService`

**Detección optimizada con cache:**
- **Verificar cache primero**: Si existe y es reciente (< 5 minutos), retornar cache
- **Solo llamar API si es necesario**: Si no hay cache o está expirado
- Para owner/admins: buscar carpetas propias con patrón `transferencias-*`
- Para employees: buscar subcarpetas compartidas con patrón `workspace-*` usando `sharingListFolders`
- **Optimización**: Si encuentra `workspace-empresa/` compartida → inferir empresa directamente sin buscar carpeta principal (solo si no se necesita metadata completa)
- Para cada empresa, inicializar y cachear rol automáticamente
- Cachear resultado con timestamp usando `StorageService`

**Código:**
```typescript
import { STORAGE_KEYS } from '../../constants/storageKeys';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function detectCompanies(forceRefresh = false): Promise<Company[]> {
  // Verificar cache primero (a menos que se fuerce refresh)
  if (!forceRefresh) {
    const cached = StorageService.get(
      STORAGE_KEYS.COMPANIES_CACHE,
      (data) => JSON.parse(data) as { companies: Company[], timestamp: number }
    );
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.companies;
    }
  }

  const dbx = await getAuthenticatedClient();
  const COMPANY_PREFIX = COMPANY_FOLDER_PREFIX;
  const WORKSPACE_PREFIX = WORKSPACE_FOLDER_PREFIX;
  
  // Buscar en paralelo: carpetas propias y compartidas
  const [ownFoldersResult, sharedFoldersResult] = await Promise.all([
    dbx.filesListFolder({ path: '' }),
    dbx.sharingListFolders()
  ]);
  
  // Procesar carpetas propias (owner/admins)
  const ownCompanies = ownFoldersResult.result.entries.filter(
    entry => entry.name.startsWith(COMPANY_PREFIX) && entry['.tag'] === 'folder'
  );
  
  // Procesar workspace compartidos (employees)
  const workspaceFolders = sharedFoldersResult.result.entries.filter(
    entry => entry.name.startsWith(WORKSPACE_PREFIX)
  );
  
  // Inferir empresas desde workspace
  // Combinar y deduplicar
  // Inicializar roles en paralelo
  // Cachear resultado con timestamp
  const companies = [...]; // resultado procesado
  
  StorageService.set(
    STORAGE_KEYS.COMPANIES_CACHE,
    { companies, timestamp: Date.now() },
    (data) => JSON.stringify(data)
  );
  
  return companies;
}
```

### 4.3 Actualizar `src/pages/CallbackPage.tsx`

**Simplificado:**
- Después de autenticación exitosa:
  1. Llamar `companyService.ensureActiveCompany()`
  2. Según resultado:
     - `redirect` → redirigir a `/create-company`
     - `none` → redirigir a `/` (empresa ya está activa o se estableció automáticamente)

### 4.4 Actualizar `src/pages/HomePage.tsx`

**Optimizado para evitar llamadas innecesarias:**
- Al cargar: llamar `companyService.ensureActiveCompany()`
- **Si ya tiene empresa activa**: No hace nada, solo muestra UI
- **Si NO tiene empresa activa**: Detecta y establece automáticamente
- **Solo hace llamadas API cuando es necesario**

**Código:**
```typescript
useEffect(() => {
  const checkCompany = async () => {
    const activeCompany = companyService.getActiveCompany();
    
    // Si ya tiene empresa activa, no hacer nada
    if (activeCompany) {
      return;
    }
    
    // Solo detectar si no tiene empresa activa
    const result = await companyService.ensureActiveCompany();
    if (result.action === 'redirect') {
      navigate('/create-company', { replace: true });
    }
  };

  checkCompany();
}, [navigate]);
```

## Fase 5: Protección de Carpeta Config

### 5.1 No modificar `fileService`

**Decisión:**
- **NO modificar `fileService`** - Dejar que Dropbox maneje la seguridad
- Dropbox ya protege el acceso a `config/` a nivel de sharing
- Si falla el acceso, Dropbox retornará error 403/404
- Manejar errores en la UI con mensajes claros

**Ventajas:**
- ✅ Menos código
- ✅ Menos complejidad
- ✅ Dropbox es la fuente de verdad
- ✅ Sin validación redundante

### 5.2 Validación en UI (Solo para mensajes personalizados)
- Si se necesitan mensajes de error personalizados, validar en la UI antes de llamar a `fileService`
- Usar `roleService.requireAdmin()` antes de operaciones críticas en servicios de negocio

## Fase 6: UI - Gestión de Miembros (Consolidada)

### 6.1 Crear `src/pages/CompanyMembersPage.tsx`

**Una sola pantalla para todo:**

**Sección Superior - Invitar Nuevo Miembro:**
- Formulario para ingresar email del empleado
- Selector de rol (admin/employee) - solo visible si usuario actual es admin
- Botón "Invitar"
- Validación de email
- Manejo de errores (email no existe, ya es miembro, etc.)

**Sección Inferior - Lista de Miembros Actuales:**
- Lista de miembros con:
  - Email
  - Rol (badge: admin/employee)
  - Fecha de ingreso
  - Botón "Cambiar rol" (solo admin, dropdown)
  - Botón "Remover" (solo admin)
- Indicador visual de quién es el owner (opcional, solo referencia)
- Confirmación antes de remover
- Actualización automática después de invitar/cambiar/remover

**Protección de ruta:**
- Verificar permisos reales al cargar la página
- Si no es admin, mostrar error o redirigir
- Usar `roleService.requireAdmin()` antes de mostrar contenido

**Flujo:**
1. Usuario intenta acceder a `/company/members`
2. Sistema verifica permisos reales (no cache)
3. Si no es admin → error/redirección
4. Si es admin → mostrar pantalla
5. Usuario ve lista de miembros actuales
6. Ingresa email y selecciona rol
7. Clic en "Invitar"
8. Sistema comparte carpeta (verificación real antes de ejecutar)
9. Lista se actualiza automáticamente
10. Cache se actualiza después de operación exitosa

**Ventajas:**
- ✅ Todo en un solo lugar
- ✅ Ver cambios inmediatamente
- ✅ Menos navegación
- ✅ Mejor UX
- ✅ Seguridad real en acceso y operaciones

### 6.2 Agregar ruta en `src/App.tsx`
- `/company/members` o `/company/:companyId/members` (usando empresa activa)
- Proteger ruta con verificación de permisos

### 6.3 Agregar acceso desde HomePage
- Botón o enlace en menú hamburguesa para "Gestionar empleados"
- Mostrar solo si cache dice que es admin (para UX rápida)
- Verificación real se hace al acceder a la ruta

## Fase 7: Menú Hamburguesa con Cambio de Empresa

### 7.1 Actualizar `src/pages/HomePage.tsx`

**Menú hamburguesa mejorado:**
- Obtener empresas desde cache (no hacer llamada API si ya están cacheadas)
- Si hay múltiples empresas: mostrar selector de empresa en el menú
- Lista de empresas disponibles con:
  - Nombre de empresa
  - Rol del usuario (admin/employee) - usar cache
  - Indicador de empresa activa
  - Botón para cambiar empresa
- Si solo hay una empresa: NO mostrar selector (selección automática)
- Botón "Gestionar empleados" (solo si es admin, usar cache de rol)
- Botón "Políticas de privacidad"
- Botón "Salir"

**Flujo de cambio de empresa:**
1. Usuario abre menú hamburguesa
2. Ve lista de empresas desde cache (si no hay cache, detectar)
3. Selecciona otra empresa
4. Llamar `companyService.switchActiveCompany(companyId)` - **solo entonces se hace nueva detección si es necesario**
5. Sistema inicializa rol (verifica y cachea)
6. Cierra menú y actualiza UI
7. **No hace llamadas API innecesarias** - solo cuando el usuario cambia empresa

### 7.2 Actualizar constantes en `src/constants/dropbox.ts`

**Centralizar todos los prefijos:**
- `COMPANY_FOLDER_PREFIX = 'transferencias-'` (ya existe)
- `WORKSPACE_FOLDER_PREFIX = 'workspace-'` (agregar)
- Función helper: `getWorkspaceFolderPath(companyName: string): string`
- Usar estas constantes en todo el código (no hardcodear strings)

## Fase 8: Mejoras y Edge Cases

### 9.1 Manejo de múltiples empresas
- Usuario puede trabajar en varias empresas
- Cambiar entre empresas desde menú hamburguesa (solo si hay múltiples)
- Si solo hay una empresa: selección automática, sin mostrar selector
- Mostrar empresa activa en header (opcional)
- Cachear rol por empresa usando `getRoleCacheKey(companyId)` de `storageKeys.ts`
- Al cambiar empresa: actualizar cache de rol

### 9.2 Validaciones adicionales
- No permitir remover al último admin (si es necesario)
- Validar que email existe en Dropbox antes de invitar
- Manejar caso donde usuario rechaza invitación
- Limpiar cache cuando se remueve acceso

### 9.3 UI/UX
- Indicadores visuales de rol en toda la app (usar cache)
- Mensajes claros cuando no tiene permisos
- Confirmaciones antes de acciones destructivas
- Loading states durante operaciones de sharing
- Actualizar cache después de cambios de rol

### 9.4 Optimizaciones de Performance
- Cachear roles al inicializar
- Verificar roles en paralelo cuando sea posible
- Limitar frecuencia de verificaciones reales
- Usar `Promise.all()` para operaciones múltiples

## Estructura de Archivos

```
src/
├── utils/
│   ├── storageService.ts          (sistema genérico de storage que reutiliza localStorage)
│   └── storageService.test.ts
├── services/
│   ├── roles/
│   │   ├── roleService.ts          (2 funciones esenciales, usa StorageService)
│   │   └── roleService.test.ts
│   └── company/
│       ├── companyService.ts       (incluye funciones de sharing)
│       └── companyService.test.ts
├── constants/
│   ├── dropbox.ts                 (actualizado con WORKSPACE_FOLDER_PREFIX)
│   └── storageKeys.ts             (actualizado con ROLE_CACHE_PREFIX y getRoleCacheKey)
├── pages/
│   ├── CompanyMembersPage.tsx     (invitar + gestionar en una página)
│   ├── HomePage.tsx               (actualizado con menú hamburguesa)
│   └── CallbackPage.tsx           (simplificado, usa detectAndSetActiveCompany)
└── components/
    (sin CompanyMembersList - integrado en página)
```

## Orden de Implementación

1. **Fase 0**: Sistema de Storage Genérico (`storageService.ts` + actualizar `storageKeys.ts`)
2. **Fase 1**: Funciones de Sharing (integrar en companyService)
3. **Fase 2**: Role Service (2 funciones esenciales, usa StorageService)
4. **Fase 3**: Extender companyService (usar funciones de sharing y roles, optimizar getCompanyMembers)
5. **Fase 4**: Detección de empresas optimizada (con cache y función centralizada)
6. **Fase 5**: No modificar fileService (ya está simplificado)
7. **Fase 6**: UI consolidada - Gestión de miembros
8. **Fase 7**: Menú hamburguesa con cambio de empresa
9. **Fase 8**: Mejoras y edge cases

## Consideraciones Técnicas

### Dropbox Sharing API
- **`sharingShareFolder`**: Compartir carpeta con email específico
- **`sharingAddFolderMember`**: Agregar miembro a carpeta ya compartida
- **`sharingRemoveFolderMember`**: Remover miembro
- **`sharingListFolderMembers`**: Listar miembros actuales
- **`sharingListFolders`**: Listar carpetas compartidas con el usuario

### Permisos de Dropbox App
- Asegurar que la app tiene permisos `sharing.write` y `sharing.read`
- Verificar en Dropbox App Console

### Storage Keys (Sin Magic Strings)
- **Todas las keys de localStorage deben venir de `STORAGE_KEYS`** en `src/constants/storageKeys.ts`
- **No usar magic strings** en el código
- Para keys dinámicas (como `role_{companyId}`), usar helper `getRoleCacheKey(companyId)`
- **Ventajas:**
  - Centralización: todas las keys en un solo lugar
  - Type-safe: TypeScript detecta errores de tipeo
  - Fácil refactorizar: cambiar key en un solo lugar
  - Sin errores: no hay riesgo de typos en strings mágicos
- **Keys existentes:**
  - `STORAGE_KEYS.DROPBOX_ACCESS_TOKEN`
  - `STORAGE_KEYS.DROPBOX_REFRESH_TOKEN`
  - `STORAGE_KEYS.DROPBOX_EXPIRES_AT`
  - `STORAGE_KEYS.DROPBOX_CODE_VERIFIER`
  - `STORAGE_KEYS.ACTIVE_COMPANY`
  - `STORAGE_KEYS.COMPANIES_CACHE`
  - `STORAGE_KEYS.ROLE_CACHE_PREFIX` (usar con `getRoleCacheKey()`)

### Metadata y Roles
- `.empresa.json`: Solo metadata básica (sin miembros, sin roles, NO para seguridad)
- Miembros: Siempre desde Dropbox Sharing API (`sharingListFolderMembers`)
- Roles: Se determinan por acceso real a carpetas (no hay JSON)
- Cache: Solo para UX en localStorage, se actualiza cuando es necesario
- No hay sincronización necesaria: Dropbox API es la fuente de verdad
- **Patrón de detección**: 
  - Owner/admins: `transferencias-*` (carpetas propias)
  - Employees: `workspace-*` (subcarpetas compartidas, inferir empresa desde nombre)

### Seguridad
- **Lista de miembros**: Dropbox Sharing API es la fuente de verdad (no modificable desde JSON)
- **Roles**: Se determinan por acceso real a carpetas (no hay JSON que modificar)
- **Verificación**: 
  - Cache para UX (mostrar/ocultar botones)
  - Verificación real solo en recursos protegidos (pantalla de admin, operaciones críticas)
- **Quién puede invitar**: Cualquier admin (tiene acceso a carpeta principal con permisos de edición)
- No confiar en cache para seguridad
- Validar permisos reales antes de operaciones críticas
- **Ventaja**: No hay estado intermedio que pueda desincronizarse - Dropbox es la única fuente de verdad

### Performance
- **Cache genérico**: Sistema unificado con inversión de control
- **Cache de empresas**: Evitar múltiples llamadas a `detectCompanies()`
- **Verificación de roles en paralelo**: `Promise.allSettled()` para verificar acceso a ambas carpetas simultáneamente
- **getCompanyMembers optimizado**: Solo 2 llamadas API (carpeta principal + workspace), cálculo de roles por diferencia de conjuntos
- **Cachear roles al inicializar**: Una vez al detectar/crear empresa
- **Usar cache para UI**: Botones, navegación (no para seguridad)
- **Verificación real solo cuando es necesario**: Acceso a admin, operaciones críticas
- **No verificar en features normales**: Todos pueden usar sin verificación

## Testing Strategy

### Unit Tests
- Cada servicio debe tener tests completos
- Mockear Dropbox API calls
- Probar casos de error
- Probar funciones de cache

### Integration Tests
- Probar flujo completo de invitar empleado
- Probar cambio de roles
- Probar detección de empresas compartidas
- Probar cache y verificación real

### Manual Testing
- Probar con múltiples cuentas de Dropbox
- Verificar que permisos funcionan correctamente
- Probar edge cases (rechazar invitación, remover último admin, etc.)
- Verificar que cache funciona correctamente
- Verificar que verificación real funciona en recursos protegidos

## Impacto de Simplificaciones

### Archivos Eliminados
- `src/services/sharing/sharingService.ts` → Integrado en `companyService`
- `src/components/CompanyMembersList.tsx` → Integrado en `CompanyMembersPage`
- `src/pages/CompanyInvitePage.tsx` → Reemplazado por `CompanyMembersPage`

### Código Reducido
- ~400-500 líneas menos de código (con optimizaciones)
- ~5-6 archivos menos
- Menos imports y dependencias
- Menos tests (mismo coverage, menos archivos)
- Sistema de cache unificado elimina duplicación

### Optimizaciones de Performance
- `getCompanyMembers()`: De N llamadas API a solo 2 (donde N = número de miembros)
- Verificación de roles: De secuencial a paralelo (más rápido)
- Detección de empresas: Cache evita múltiples llamadas
- Búsqueda de carpetas: En paralelo (propias + compartidas)

### Complejidad
- Menos servicios = menos abstracciones = más fácil de entender
- Menos funciones = más fácil de mantener
- UI consolidada = mejor UX
- Cache optimizado = mejor performance
- Verificación real solo cuando es necesario = más eficiente

## Notas Finales

- **Storage genérico con inversión de control**: Un solo sistema que reutiliza localStorage existente, el consumidor pasa funciones directamente
- **Cache es solo para UX**: Nunca usar cache para decisiones de seguridad
- **Detección optimizada**: Solo detecta empresas cuando es necesario (no hay empresa activa o usuario cambia empresa)
- **Evitar llamadas repetidas**: HomePage no hace nada si ya tiene empresa activa, solo cuando el usuario cambia empresa se hace nueva detección
- **Verificación real siempre en recursos protegidos**: Pantalla de admin y operaciones críticas
- **Dropbox es la fuente de verdad**: Siempre verificar contra Dropbox API cuando importa
- **Performance optimizado**: 
  - Verificación de roles en paralelo
  - `getCompanyMembers()` optimizado (solo 2 llamadas API)
  - Cache de empresas detectadas con TTL (5 minutos)
  - Búsquedas en paralelo cuando es posible
  - No hacer llamadas API innecesarias cuando ya tenemos información
- **Seguridad mantenida**: Verificación real en todos los puntos críticos
- **Código más simple**: Eliminados métodos no usados, funciones consolidadas, menos duplicación
- **Reutilización**: Sistema de storage reutiliza lógica de localStorage existente en el proyecto
