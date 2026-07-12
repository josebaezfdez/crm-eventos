# EventMargin

EventMargin es un CRM para empresas de eventos y espectáculos diseñado para generar presupuestos rápidos, rentables y con aislamiento multi-empresa. 

## Arquitectura y Stack Tecnológico

El proyecto está construido como un SaaS escalable, moderno y serverless:

- **Frontend**: React, TypeScript, Vite, Tailwind CSS y Zustand para el estado global.
- **Backend**: Cloudflare Workers, Hono (API REST ligera).
- **Base de Datos**: Cloudflare D1 (SQLite distribuido) con Drizzle ORM.
- **Almacenamiento (Archivos/Imágenes)**: Cloudflare R2 (Buckets para logotipos de empresa y recursos estáticos).
- **Autenticación**: JSON Web Tokens (JWT) con encriptación PBKDF2 para contraseñas.
- **Despliegue**: Cloudflare Pages (Frontend) y Cloudflare Workers (Backend).

## Características principales

- **Arquitectura Multi-Empresa**: Cada empresa (tenant) tiene sus propios clientes, eventos, configuraciones, logotipos e identidades (aislamiento total garantizado en el backend mediante el `companyId` del token JWT).
- **Seguridad Moderna**: Cifrado PBKDF2 con sal individualizada para las credenciales, validación estricta de payloads con esquemas Zod (`.partial()` en actualizaciones).
- **Gestión Centralizada**: El store de Zustand encapsula las peticiones de red y mantiene el estado sincronizado de forma optimista con gestión resiliente de errores.
- **Identidad Corporativa Dinámica**: Logotipos claros y oscuros por empresa cargados en Cloudflare R2 y consumidos vía endpoints autenticados.
- **Generación de Documentos**: Presupuestos exportables a PDF con múltiples plantillas (clásica, moderna, bold) adaptables automáticamente a la configuración visual de la empresa emisora.

## Flujos principales
1. **Presupuesto Rápido (Quick Start)**: Permite crear un evento y un cliente simultáneamente sin abandonar la pantalla de creación de presupuesto, o reutilizar clientes existentes para evitar duplicidades.
2. **Control de Márgenes**: Cálculo en tiempo real de costes directos, indirectos y márgenes esperados en base al objetivo configurado por la empresa.

## Scripts de desarrollo

### Frontend
- `npm run dev`: Servidor local Vite
- `npm run build`: Compilación de producción
- `npm run typecheck`: Validación de TypeScript
- `npm test`: Ejecuta los tests de Vitest

### Backend
- `npm run dev`: Entorno de Cloudflare Worker local con Wrangler.
- `npm run deploy`: Despliega el worker en producción.
- `npm run db:migrate:local`: Aplica migraciones D1 en el entorno local.
- `npm run db:migrate:remote`: Aplica migraciones D1 en la base de datos de producción.

## Alojamiento (Cloudflare)
EventMargin utiliza la suite completa de Cloudflare para ofrecer latencias mínimas y escalabilidad global, unificando la entrega del Single Page Application y la API REST en el Edge Network.
