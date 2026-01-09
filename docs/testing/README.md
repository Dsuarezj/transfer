# Documentación de Testing

Esta carpeta contiene toda la documentación relacionada con la estrategia de testing del proyecto.

## Archivos

### 📋 [Análisis de Testing](./ANALISIS_TESTING.md)
Análisis completo de lo que se necesita para implementar la estrategia de testing TDD:
- Estado actual del proyecto
- Dependencias necesarias
- Configuración requerida
- Estructura de carpetas
- Prioridades de implementación

### 🏗️ [Estructura de Testing](./ESTRUCTURA_TESTING.md)
Guía detallada de la estructura de testing con colocation:
- Principio de colocation (pruebas junto al código)
- Convenciones de nombres
- Utilidades compartidas
- Ejemplos de uso
- Ventajas de la estructura

### 🚀 [Mejoras de Testing](./MEJORAS_TESTING.md)
Mejoras adicionales recomendadas para optimizar el testing:
- Mejoras implementadas
- Mejoras adicionales recomendadas
- Prioridades de implementación
- Convenciones de testing
- Recursos útiles

## Orden de Lectura Recomendado

1. **ANALISIS_TESTING.md** - Entender qué necesitamos
2. **ESTRUCTURA_TESTING.md** - Ver cómo está organizado
3. **MEJORAS_TESTING.md** - Optimizaciones futuras

## Quick Start

Para empezar a escribir pruebas:

```bash
# Instalar dependencias
npm install -D vitest @vitest/ui @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node msw vitest-mock-extended @playwright/test

# Ejecutar tests
npm test

# Ver UI de tests
npm run test:ui

# Ver coverage
npm run test:coverage
```

## Estructura de Pruebas

```
src/
├── services/
│   ├── invoiceService.ts
│   └── invoiceService.test.ts          # ✅ Prueba al lado
│
├── components/
│   ├── InvoiceCard.tsx
│   └── InvoiceCard.test.tsx            # ✅ Prueba al lado
│
└── test/                               # Utilidades compartidas
    ├── setup.ts
    ├── helpers.tsx
    ├── mocks/
    └── fixtures/
```

## Reglas de Testing

Ver [.cursorrules](../../.cursorrules) para las reglas de código y testing que seguimos en el proyecto.

