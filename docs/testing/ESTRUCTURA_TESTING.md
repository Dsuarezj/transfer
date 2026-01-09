# Estructura de Testing - Colocation

## Principio: Pruebas cerca del código

Las pruebas están ubicadas **junto al archivo que testean** para facilitar su localización y mantenimiento.

## Estructura de Carpetas

```
src/
├── test/                    # Utilidades compartidas de testing
│   ├── setup.ts            # Configuración global de tests
│   ├── helpers.tsx         # Helpers para renderizar componentes
│   ├── mocks/              # Mocks compartidos
│   │   └── dropbox.ts
│   └── fixtures/           # Datos de prueba reutilizables
│       └── invoices.ts
│
├── services/
│   ├── invoiceService.ts
│   ├── invoiceService.test.ts          # ✅ Prueba unitaria al lado
│   ├── invoiceService.integration.test.ts  # ✅ Prueba integración al lado
│   ├── transferIdService.ts
│   ├── transferIdService.test.ts       # ✅ Prueba unitaria al lado
│   └── dropbox/
│       ├── authService.ts
│       ├── authService.test.ts         # ✅ Prueba unitaria al lado
│       ├── fileService.ts
│       └── fileService.test.ts         # ✅ Prueba unitaria al lado
│
├── components/
│   ├── InvoiceCard.tsx
│   ├── InvoiceCard.test.tsx            # ✅ Prueba al lado
│   ├── CameraView.tsx
│   └── CameraView.test.tsx             # ✅ Prueba al lado
│
├── hooks/
│   ├── useCamera.ts
│   ├── useCamera.test.ts               # ✅ Prueba al lado
│   ├── useDropboxAuth.ts
│   └── useDropboxAuth.test.ts          # ✅ Prueba al lado
│
└── pages/
    ├── UploadTransferPage.tsx
    └── UploadTransferPage.test.tsx     # ✅ Prueba al lado

e2e/                                    # Pruebas E2E separadas
├── fixtures/
└── specs/
    ├── upload-transfer.spec.ts
    └── review-invoices.spec.ts
```

## Convenciones de Nombres

- **Pruebas unitarias**: `archivo.test.ts` o `archivo.test.tsx`
- **Pruebas de integración**: `archivo.integration.test.ts`
- **Pruebas E2E**: `feature.spec.ts` (en carpeta `e2e/`)

## Ventajas de esta Estructura

1. ✅ **Colocation**: Pruebas visibles junto al código
2. ✅ **Navegación fácil**: Encuentras la prueba rápidamente
3. ✅ **Mantenimiento**: Cambias código y prueba en el mismo lugar
4. ✅ **Refactoring**: Mover archivos incluye sus pruebas
5. ✅ **Onboarding**: Nuevos desarrolladores entienden rápido

## Utilidades Compartidas

### `src/test/setup.ts`
Configuración global que se ejecuta antes de cada prueba:
- Configuración de `@testing-library/jest-dom`
- Mocks globales (matchMedia, etc.)
- Cleanup automático

### `src/test/helpers.tsx`
Helpers para testing de componentes React:
- `render()`: Wrapper con ChakraProvider y Router
- Re-exporta todo de `@testing-library/react`

### `src/test/mocks/`
Mocks compartidos para servicios externos:
- `dropbox.ts`: Mocks de servicios de Dropbox

### `src/test/fixtures/`
Datos de prueba reutilizables:
- `invoices.ts`: Facturas de ejemplo

## Ejemplo de Uso

```typescript
// src/services/invoiceService.test.ts
import { describe, it, expect } from 'vitest';
import { invoiceService } from './invoiceService';
import { mockInvoice } from '../test/fixtures/invoices';

describe('InvoiceService', () => {
  it('debe procesar factura correctamente', () => {
    // prueba aquí
  });
});
```

## Mejoras Implementadas

1. ✅ **Colocation**: Pruebas junto al código
2. ✅ **Helpers centralizados**: `src/test/helpers.tsx` para componentes
3. ✅ **Fixtures reutilizables**: Datos de prueba compartidos
4. ✅ **Mocks organizados**: Mocks en `src/test/mocks/`
5. ✅ **Setup global**: Configuración en `src/test/setup.ts`
6. ✅ **Coverage configurado**: Umbrales mínimos del 80%
7. ✅ **E2E separado**: Playwright en carpeta `e2e/`
8. ✅ **Scripts útiles**: Comandos npm para diferentes escenarios

## Próximos Pasos

1. Escribir primera prueba siguiendo TDD
2. Configurar MSW para mockear APIs
3. Añadir más fixtures según necesidad
4. Crear pruebas E2E para flujos críticos

