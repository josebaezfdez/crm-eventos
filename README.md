# EventMargin

> Herramienta de presupuestación y rentabilidad para pequeños negocios de eventos:
> pubs, bares, coctelerías móviles, caterings pequeños, DJs, fotógrafos, músicos,
> wedding planners locales y proveedores de eventos.

EventMargin ayuda a dejar de presupuestar "a ojo". Antes de aceptar un trabajo,
sabes si un evento es rentable: calcula costes directos, partners, personal e
indirectos, recomienda un precio mínimo, mide el margen real y te avisa con
alertas visuales cuando el precio ofertado está por debajo de lo saludable.

Esta es una **demo MVP frontend** que funciona sin backend: los datos se
guardan en `localStorage` del navegador. La arquitectura está preparada para
sustituir la capa de datos por Supabase o una API REST sin reescribir la UI.

---

## Qué hace la app

- **Cuadro de mando** con facturación estimada del mes, beneficio, margen medio,
  eventos confirmados, presupuestos pendientes/aceptados, dinero por cobrar,
  eventos más y menos rentables, gráfico ingresos vs costes y próximos eventos.
- **Eventos** con listado, filtro por estado, detalle económico, badges de
  rentabilidad y cambio de estado (borrador / presupuestado / aceptado /
  rechazado / completado).
- **Wizard de presupuesto en 5 pasos**:
  1. Datos del evento (cliente, fecha, ubicación, tipo, asistentes, duración).
  2. Elección de paquete base (con costes precargados) o personalizado.
  3. Líneas de coste con categoría, cantidad, coste unitario, total automático
     y visibilidad para el cliente.
  4. Partners y extras (DJ, fotógrafo, fotomatón, camareros…) que se añaden al
     presupuesto automáticamente con su precio.
  5. Precio y rentabilidad: margen objetivo editable, IVA, precio ofertado,
     mínimo recomendado, beneficio, alertas visuales y **simulador de escenarios**.
- **Vista profesional del presupuesto** tipo documento, con datos del negocio,
  datos del cliente y evento, servicios visibles, totales, forma de pago
  recomendada y condiciones comerciales. **No muestra costes internos ni márgenes.**
- **Clientes / Partners / Paquetes** con CRUD local sencillo.
- **Resultado post-evento**: compara costes presupuestados vs reales, precio
  cobrado, margen previsto vs real, desviación por categoría y mensajes
  contextuales del tipo *"Para un evento similar, el precio debería subir un X%"*.
- Botones "Próximamente" ya visibles en la UI: subir ticket/factura (lectura
  automática), exportar PDF y enviar presupuesto por email.

### Lógica de cálculo de rentabilidad

Toda la matemática vive en `src/utils/marginCalculator.ts`:

1. **Coste total**
   `totalCost = directCosts + partnerCosts + laborCosts + indirectCosts`
   (los items se clasifican por categoría en bloques).
2. **Precio mínimo recomendado sin IVA**
   `recommendedPriceWithoutVAT = totalCost / (1 - targetMargin/100)`
3. **IVA**
   `recommendedPriceWithVAT = recommendedPriceWithoutVAT * (1 + vat/100)`
4. **Beneficio esperado**
   `expectedProfit = offeredPriceWithoutVAT - totalCost`
5. **Margen esperado**
   `expectedMarginPercentage = (expectedProfit / offeredPriceWithoutVAT) * 100`
6. **Alertas de rentabilidad**
   - Margen < 0 → rojo "Pérdida"
   - < 20% → rojo "Evento no recomendable"
   - 20–35% → ámbar "Margen ajustado"
   - 35–50% → verde "Evento rentable"
   - > 50% → azul "Margen excelente"
7. **Simulador de escenarios**: precio actual, mínimo recomendado, premium
   (+15%), eliminar partner más barato, eliminar todos los partners, y subidas
   de precio de +10%, +20% y +30%. Cada escenario muestra precio, coste,
   beneficio, margen y recomendación textual.

### Datos mock (demo "EventMargin", coctelería móvil)

Cargados automáticamente la primera vez:

- 4 clientes (empresa para afterwork, pareja para boda íntima, particular para
  cumpleaños, agencia pequeña de eventos).
- 6 partners (DJ 300€/evento, fotógrafo 250€/evento, músico 180€/evento,
  fotomatón 350€/evento, camarero 15€/h, técnico de sonido 120€/evento).
- 5 paquetes (corner básico 3h, corner premium 5h, evento completo, afterwork
  empresa, boda íntima) con costes y margen objetivo.
- 4 eventos, entre ellos **"Evento privado día completo"** completado a
  1.000 € con coste de 728 €, que la app marca claramente como margen bajo y
  recomienda subir el precio ~18% para eventos similares.

Para reiniciar la demo a los datos originales puedes limpiar `localStorage`
(claves con prefijo `eventmargin:`) y recargar.

---

## Cómo ejecutarla

Requisitos: Node 18+ y npm.

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto http://localhost:5173).

Otros comandos:

```bash
npm run build     # compila a dist/ (tsc --noEmit + vite build)
npm run typecheck # solo chequeo de tipos
npm run preview   # sirve el build de producción
```

No hay backend, ni login, ni base de datos: todo es local al navegador.

---

## Estructura del proyecto

```
src/
  components/
    ui/            # Botones, tarjetas, badges, inputs, modal, StatCard, etc.
    layout/        # AppLayout + Sidebar (responsive con drawer móvil)
    budgets/       # WizardStepper, BudgetItemsEditor, ScenarioTable
    dashboard/     # (espacio para futuras tarjetas de dashboard)
    events/        # (espacio para futuras tarjetas de eventos)
    clients/       # (espacio para futuras tarjetas de clientes)
    partners/      # (espacio para futuras tarjetas de partners)
    packages/      # (espacio para futuras tarjetas de paquetes)
  pages/           # DashboardPage, EventsPage, EventDetailPage,
                   # BudgetWizardPage, BudgetViewPage, ClientsPage,
                   # PartnersPage, PackagesPage, PostEventPage
  data/            # mockData.ts (datos iniciales Malatesta)
  hooks/           # useSelectors.ts (datos derivados del store)
  store/           # useStore.ts (Zustand + persistencia localStorage)
  types/           # index.ts (tipos del dominio)
  utils/           # marginCalculator.ts + format.ts
  services/        # localStorageService.ts
  styles/          # index.css (Tailwind + utilidades base)
```

### Capa de datos y futura conexión a backend

El flujo de datos es:

```
Componentes ──▶ hooks/useSelectors ──▶ store/useStore (Zustand)
                                          │
                                          ▼
                          services/localStorageService
                                          │
                                          ▼
                                  window.localStorage
```

Para conectar un backend (Supabase / API REST):

1. Sustituir `services/localStorageService.ts` por un cliente que hable con la
   API manteniendo la misma superficie (`loadSlice`/`saveSlice` o equivalentes
   async).
2. Migrar las acciones del store en `store/useStore.ts` a llamadas async y
   guardar el resultado devuelto. La firma pública puede mantenerse igual (o
   pasar a `async`) sin tocar los componentes de presentación.
3. Los tipos en `types/index.ts` ya están listos para mapear filas de BBDD;
   basta con añadir los campos de auditoría que el backend requiera
   (`created_at`, `updated_at`, `user_id`, RLS, etc.).
4. La lógica de cálculo en `utils/marginCalculator.ts` no cambia: es pura y
   reutilizable en cliente o servidor.

---

## Stack

- **React 18 + TypeScript** con Vite.
- **Tailwind CSS** para estilos (tema claro, tarjetas blancas, sombras sutiles).
- **Zustand** para estado global con persistencia manual en `localStorage`.
- **React Router** para la navegación.
- Componentes propios reutilizables (sin librerías de UI externas).
- Gráfico de ingresos vs costes hecho solo con Tailwind (sin librerías de
  gráficos).

---

## Qué queda pendiente para conectar backend

- Autenticación real (multiusuario / multi-negocio).
- Base de datos persistente (Supabase o equivalente) y RLS por negocio.
- Subida real de tickets/facturas + lectura automática (OCR).
- Exportación real a PDF de la vista profesional del presupuesto.
- Envío real de presupuestos por email.
- Facturación fiscal real (integración con herramienta externa).
- Pasarela de pago / integración con bancos.
- Sincronización entre dispositivos.

La UI ya tiene botones "Próximamente" para estas funciones, de forma que la
demo pueda enseñarse a clientes reales sin prometer nada que no exista.

---

## Notas

- El producto **no** implementa facturación fiscal completa: se centra en
  presupuestos, rentabilidad, eventos, clientes, partners y control económico
  básico.
- El único negocio mostrado en la demo es "Malatesta · Coctelería móvil" como
  ejemplo realista para validar la propuesta de valor.
- El flujo principal está pensado para entenderse en menos de 2 minutos:
  **crear evento → añadir costes → calcular rentabilidad → generar presupuesto**.
