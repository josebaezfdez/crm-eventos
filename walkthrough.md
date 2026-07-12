# Walkthrough: Consolidación de Fase 2.1 (EventMargin MVP)

Este documento resume los cambios estructurales e hitos técnicos alcanzados durante la Fase 2.1 del proyecto EventMargin, centrándose en la estabilidad y seguridad de la aplicación para producción.

## 1. Migración a Hashes Seguros (PBKDF2)
- Se ha eliminado el almacenamiento de contraseñas en texto plano.
- Se implementó la Web Crypto API en el entorno de Cloudflare Workers para utilizar el algoritmo PBKDF2 (100.000 iteraciones, SHA-256) acompañado de una *salt* individual de 16 bytes generada aleatoriamente por usuario.
- **Acción realizada:** Para no romper el acceso de la cuenta administradora existente, se calculó el hash PBKDF2 de la contraseña antigua de forma local y se inyectó en D1 (Base de Datos en Producción) utilizando comandos de migración.

## 2. Refactorización del Cliente API (Zustand store)
- **Centralización y Entornos:** Se introdujo `src/config.ts` para manejar dinámicamente la URL del backend mediante la variable `VITE_API_URL` con fallback a producción según si el entorno local o de Cloudflare Pages lo requiere. 
- **Gestión Resiliente de Errores:** Todos los métodos de API (`get`, `post`, `put`, `delete`) ahora verifican obligatoriamente `response.ok`. Si falla, se parsea el JSON del error para extraer el mensaje original del backend y se lanza una excepción de JavaScript. Esto previene que Zustand actualice su estado optimista con datos que no han sido persistidos.
- **Gestión de la Sesión:** Se interceptan automáticamente las respuestas `401 Unauthorized` desde el *fetcher* central para disparar el método `logout()`, cerrando la sesión de inmediato y redirigiendo al usuario de forma elegante.

## 3. Seguridad en Endpoints y Validación (Zod)
- **Esquemas Estrictos de Modificación:** Se han creado esquemas diferenciados para creación (`Schema`) y actualización (`UpdateSchema`). En las rutas `PUT`, Zod:
  - Elimina campos inmutables como `id` o `companyId` usando `.omit()`.
  - Transforma todos los campos a opcionales con `.partial()`.
  - Evita inyección de datos con `.strict()`.
  - Asegura que al menos un campo se envíe usando `.refine()`.
- **CORS Configurado:** El middleware de CORS se limitó a las URLs seguras y permitidas (`https://crm-eventos.pages.dev` y `http://localhost:5173`) evitando peticiones no autorizadas de terceros dominios.
- **Subida de Archivos Segura:** Se bloquean formatos inseguros en la subida a Cloudflare R2, permitiendo exclusivamente `image/png`, `image/jpeg`, `image/webp` y `image/svg+xml`, limitando el payload a 2MB.

## 4. Branding Dinámico y Archivos Absolutos
- El frontend gestiona las imágenes del perfil corporativo de manera dinámica a través de la nueva utilidad `getImageUrl`.
- La barra de navegación lateral consume el logotipo de versión clara automáticamente.
- La generación de documentos PDF (clásica, moderna o bold) consume ahora el logotipo de versión oscura en sus fondos blancos.
- El guardado de la configuración en *Settings* es reactivo y actualiza el global store inmediatamente sin recargas completas del frontend.

## 5. Mejora del Flujo de Presupuesto Rápido (Quick Start)
- El asistente inicial permite registrar clientes, eventos y presupuestos en un solo paso.
- Se agregó la capacidad de buscar y **reutilizar un cliente existente** mediante un selector integrado y una validación del email, evitando colisiones de datos en la BD.
- Se agregaron campos iniciales por defecto que inciden fuertemente en los cálculos de margen para hostelería y eventos: asistentes, duración y tipo de evento.

## Siguientes Pasos (Fase 3)
La base del producto ya se encuentra aislada, robusta y escalable bajo la capa gratuita de Cloudflare. Los próximos desarrollos abordarán capacidades más complejas de facturación e integración comercial.
