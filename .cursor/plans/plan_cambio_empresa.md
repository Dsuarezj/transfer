# Plan Simplificado - Cambio de Empresa

## Objetivo
Implementar funcionalidad para cambiar entre múltiples empresas desde el menú hamburguesa, centralizando la lógica de detección y establecimiento de empresa activa.

## Principios
- **Centralización**: Toda la lógica de detección/establecimiento en `companyService.ensureActiveCompany()`
- **Sin duplicación**: Eliminar lógica duplicada en `HomePage` y `CallbackPage`
- **Solo verificar cuando es necesario**: Detección solo al cambiar empresa o cuando no hay empresa activa
- **TDD**: Escribir tests primero

## Escenario: Usuario Admin de una empresa, Employee de otra

### Cómo funciona:
1. **Detección**: `detectCompanies()` encuentra ambas empresas con sus roles:
   - Empresa A: `role: USER_ROLES.ADMIN` (tiene acceso a `/transferencias-empresa-a/`)
   - Empresa B: `role: USER_ROLES.EMPLOYEE` (solo tiene acceso a `/workspace-empresa-b/`)

2. **Cache**: Cada empresa en el array tiene su `role` almacenado:
```typescript
[
  { id: 'empresa-a', name: 'Empresa A', role: USER_ROLES.ADMIN, ... },
  { id: 'empresa-b', name: 'Empresa B', role: USER_ROLES.EMPLOYEE, ... }
]
```

3. **Empresa activa**: Solo una empresa activa a la vez. El rol se determina por la empresa activa:
   - Si activa = Empresa A → rol = ADMIN → muestra "Añadir empleado"
   - Si activa = Empresa B → rol = EMPLOYEE → no muestra "Añadir empleado"

## Fase 1: Centralizar `ensureActiveCompany()` (TDD)

### 1.1 Tests: `src/services/company/companyService.test.ts`
- Test: retorna `{ action: 'none', company }` cuando ya hay empresa activa con acceso válido
- Test: retorna `{ action: 'redirect' }` cuando no hay empresas detectadas
- Test: establece primera empresa como activa cuando hay empresas pero no hay activa
- Test: limpia empresa activa si no tiene acceso y establece primera disponible
- Test: retorna `{ action: 'none', company }` cuando hay empresa activa válida

### 1.2 Implementar `ensureActiveCompany()` en `companyService.ts`
```typescript
async function ensureActiveCompany(): Promise<{ action: 'redirect' | 'none', company?: Company }> {
  const activeCompany = getActiveCompany();
  
  if (activeCompany) {
    const hasAccess = await verifyActiveCompanyAccess();
    if (hasAccess) {
      return { action: 'none', company: activeCompany };
    }
    clearActiveCompany();
  }
  
  const companies = await detectCompanies(roleService.getUserRole);
  
  if (companies.length === 0) {
    return { action: 'redirect' };
  }
  
  setActiveCompany(companies[0].id);
  return { action: 'none', company: companies[0] };
}
```

**Nota**: Necesita importar `roleService.getUserRole` - usar inversión de control pasando la función como parámetro.

### 1.3 Actualizar `HomePage.tsx` y `CallbackPage.tsx`
- Reemplazar lógica duplicada con llamada a `companyService.ensureActiveCompany()`
- Simplificar código

## Fase 2: Implementar `switchActiveCompany()` (TDD)

### 2.1 Tests: `src/services/company/companyService.test.ts`
- Test: cambia empresa activa cuando existe en cache
- Test: detecta empresas si no están en cache
- Test: verifica y cachea rol de la nueva empresa activa
- Test: lanza error si empresa no existe

### 2.2 Implementar `switchActiveCompany()` en `companyService.ts`
```typescript
async function switchActiveCompany(companyId: string, getRole?: GetRoleFn): Promise<Company> {
  const cachedCompanies = localStorage.getItem(STORAGE_KEYS.COMPANIES_CACHE);
  let companies: Company[] = cachedCompanies ? JSON.parse(cachedCompanies) : [];
  
  let company = companies.find(c => c.id === companyId);
  
  if (!company) {
    companies = await detectCompanies(getRole);
    company = companies.find(c => c.id === companyId);
    if (!company) {
      throw new Error('Empresa no encontrada');
    }
  }
  
  if (!company.role && getRole) {
    company.role = await getRole(company.name, company.folderPath) || undefined;
    addCompanyToCache(company);
  }
  
  setActiveCompany(companyId);
  return company;
}
```

## Fase 3: UI - Página de Selección de Empresas (TDD)

### 3.1 Crear página `CompanySelectPage.tsx`
**Estructura:**
- Página completa (no modal) para seleccionar empresa
- Usar `PageHeader` con botón "Volver"
- Layout similar a otras páginas (gradiente de fondo, contenedor blanco)

**Contenido:**
- **Título**: "Seleccionar Empresa"
- **Lista de empresas disponibles** (VStack/SimpleGrid):
  - Card por empresa con:
    - Nombre de empresa
    - Rol (badge: Admin/Empleado)
    - Indicador visual de empresa activa (checkmark o highlight)
    - Botón "Seleccionar" (deshabilitado si ya es activa)
- **Botón "Crear nueva empresa"** (separado, destacado)
- **Espacio para publicidad**:
  - Sección dedicada al final o entre empresas
  - Usar `Box` con altura mínima para reservar espacio
  - Preparado para recibir contenido futuro

**Estados:**
- Loading: mostrar `LoadingSpinner` mientras detecta empresas
- Empty: mostrar mensaje "No tienes empresas" + botón "Crear nueva empresa"
- Error: mostrar mensaje de error con toast

**Lógica:**
- Al cargar (`useEffect`): detectar empresas usando `companyService.detectCompanies(roleService.getUserRole)`
- Al seleccionar empresa: llamar `companyService.switchActiveCompany(companyId, roleService.getUserRole)`
- Después de seleccionar: redirigir a `/` con `navigate('/', { replace: true })`
- Obtener empresa activa con `companyService.getActiveCompany()` para indicar cuál está activa

### 3.2 Actualizar `HamburgerMenu.tsx`
- Agregar botón "Cambiar empresa" en el menú (antes de "Políticas de privacidad")
- Al hacer clic: navegar a `/select-company`
- Botón visible siempre (permite cambiar incluso si hay una empresa)

### 3.3 Agregar ruta en `App.tsx`
- Ruta `/select-company` protegida
- Renderiza `CompanySelectPage`
- Importar y agregar en `<Route element={<ProtectedRoute />}>`

### 3.4 Tests (opcional, pero recomendado)
- Test de renderizado con empresas
- Test de selección de empresa
- Test de redirección después de seleccionar
- Test de estado vacío (sin empresas)

## Consideraciones Técnicas

### Evitar duplicación
- Toda la lógica de detección/establecimiento en `ensureActiveCompany()`
- `HomePage` y `CallbackPage` solo llaman a esta función
- `switchActiveCompany()` reutiliza `detectCompanies()` si es necesario

### Cache de empresas
- Usar `COMPANIES_CACHE` existente
- No implementar TTL por ahora (simplificación)
- Actualizar cache cuando se detectan empresas

### Roles por empresa
- Cada `Company` en el array tiene su `role`
- El rol se verifica al detectar empresas
- Al cambiar empresa, el rol viene del objeto `Company` en cache

## Orden de Implementación

1. **Fase 1**: Centralizar `ensureActiveCompany()` (TDD)
   - Tests primero
   - Implementación
   - Actualizar `HomePage` y `CallbackPage`

2. **Fase 2**: Implementar `switchActiveCompany()` (TDD)
   - Tests primero
   - Implementación

3. **Fase 3**: UI - Selector de empresas
   - Crear `CompanySelector`
   - Actualizar `HamburgerMenu`

## Simplificaciones

- ❌ No implementar TTL en cache (por ahora)
- ❌ No usar `sharingListFolders` para employees (mantener detección actual)
- ❌ No cachear roles por empresa en localStorage separado (usar `role` en objeto `Company`)
- ✅ Solo lo mínimo necesario para funcionar

