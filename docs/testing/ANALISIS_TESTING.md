# Análisis: Estrategia de Testing TDD

## Estado Actual
- ❌ No hay dependencias de testing instaladas
- ❌ No hay configuración de testing
- ❌ No hay archivos de pruebas (.test.ts, .spec.ts)
- ❌ No hay scripts de testing en package.json
- ❌ No hay estructura de carpetas para pruebas

## Lo que Necesitamos Implementar

### 1. Dependencias de Testing

#### Para Pruebas Unitarias e Integración:
- **vitest**: Framework de testing (compatible con Vite)
- **@testing-library/react**: Para probar componentes React
- **@testing-library/jest-dom**: Matchers adicionales para DOM
- **@testing-library/user-event**: Para simular interacciones de usuario
- **@vitest/ui**: Interfaz visual para ver pruebas (opcional pero útil)
- **jsdom**: Entorno DOM para pruebas en Node.js

#### Para Mocks y Utilidades:
- **msw** (Mock Service Worker): Para mockear APIs HTTP
- **vitest-mock-extended**: Para mocks avanzados de TypeScript

#### Para Pruebas E2E:
- **playwright** o **cypress**: Framework E2E
  - Recomendación: **Playwright** (más moderno, mejor con TypeScript)

### 2. Configuración Necesaria

#### Archivos a Crear:
1. **vitest.config.ts**: Configuración de Vitest
2. **playwright.config.ts**: Configuración de Playwright (si usamos E2E)
3. **setupTests.ts**: Setup global para pruebas (mocks, matchers, etc.)

#### Modificaciones:
- **vite.config.ts**: Añadir configuración de testing
- **package.json**: Añadir scripts de testing
- **tsconfig.json**: Añadir tipos de testing

### 3. Estructura de Carpetas (Colocation)

**Estructura mejorada con colocation** - Pruebas junto al código:

```
src/
├── test/                # Utilidades compartidas
│   ├── setup.ts        # Configuración global
│   ├── helpers.tsx     # Helpers para componentes
│   ├── mocks/          # Mocks compartidos
│   └── fixtures/       # Datos de prueba
│
├── services/
│   ├── invoiceService.ts
│   ├── invoiceService.test.ts          # ✅ Al lado
│   └── invoiceService.integration.test.ts
│
├── components/
│   ├── InvoiceCard.tsx
│   └── InvoiceCard.test.tsx            # ✅ Al lado
│
└── [resto del código]

e2e/                     # Pruebas E2E separadas
├── fixtures/
└── specs/
```

**Ventajas:**
- ✅ Pruebas visibles junto al código
- ✅ Fácil navegación y mantenimiento
- ✅ Refactoring más simple

### 4. Scripts de Testing

Añadir a `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 5. Configuración de Coverage

- **@vitest/coverage-v8**: Para generar reportes de cobertura
- Configurar umbrales mínimos de cobertura

### 6. Archivos de Ejemplo a Crear

Para empezar con TDD, necesitamos ejemplos de:
- Prueba unitaria de un servicio (ej: `invoiceService.test.ts`)
- Prueba de integración (ej: `invoiceService.integration.test.ts`)
- Prueba de componente (ej: `InvoiceCard.test.tsx`)
- Prueba E2E básica (ej: `upload-transfer.spec.ts`)

## Prioridades de Implementación

### Fase 1: Setup Básico (Crítico)
1. Instalar dependencias básicas de Vitest
2. Configurar `vitest.config.ts`
3. Crear `setupTests.ts`
4. Añadir scripts a `package.json`
5. Crear estructura de carpetas

### Fase 2: Pruebas Unitarias (Alta)
1. Crear primeras pruebas unitarias para servicios
2. Configurar mocks para Dropbox
3. Añadir coverage básico

### Fase 3: Pruebas de Integración (Media)
1. Configurar pruebas de integración
2. Crear mocks de servicios externos (MSW)
3. Probar flujos completos entre servicios

### Fase 4: Pruebas E2E (Baja - Solo features complejos)
1. Instalar y configurar Playwright
2. Crear pruebas E2E para flujos críticos
3. Configurar CI/CD para E2E

## Checklist de Implementación

- [ ] Instalar dependencias de testing
- [ ] Configurar Vitest
- [ ] Crear setupTests.ts
- [ ] Añadir scripts de testing
- [ ] Crear estructura de carpetas
- [ ] Configurar coverage
- [ ] Crear primeros mocks (Dropbox, fileService)
- [ ] Escribir primera prueba unitaria (ejemplo)
- [ ] Escribir primera prueba de integración (ejemplo)
- [ ] Configurar Playwright (si se necesita E2E)
- [ ] Documentar convenciones de testing

## Notas Importantes

1. **Vitest** es la mejor opción porque:
   - Se integra nativamente con Vite
   - Usa la misma configuración que Vite
   - Es rápido y compatible con Jest
   - Soporta TypeScript out-of-the-box

2. **MSW (Mock Service Worker)** es ideal para:
   - Mockear llamadas a Dropbox API
   - Pruebas de integración sin servidor real
   - Interceptar requests HTTP

3. **Playwright vs Cypress**:
   - Playwright: Mejor para TypeScript, más rápido, mejor con múltiples navegadores
   - Cypress: Más popular, mejor documentación, pero más lento

4. **Estrategia de Mocks**:
   - Mockear `fileService` y `authService` de Dropbox
   - Usar MSW para interceptar llamadas HTTP reales
   - Crear fixtures de datos de prueba

