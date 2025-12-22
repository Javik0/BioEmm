# Arquitectura propuesta (Web + Móvil + Portal) — Firebase

Fecha: 2025-12-22

## 1) Objetivo
Construir una plataforma multiusuario para gestión agrícola con:
- **Web interna**: gestión de clientes, inventario, dosificaciones, reportes y mapa.
- **Portal de clientes**: ver ficha, ubicación, reportes y **crear pedidos/solicitudes**.
- **App móvil de campo (offline-first)**: captura de datos y fotos sin señal, sincronización automática.
- Persistencia “para siempre” (hasta borrado explícito), con backups y auditoría.

## 2) Stack recomendado
- **Firebase Authentication**: login + recuperación + MFA opcional.
- **Firestore**: base de datos principal (offline en móvil y web).
- **Firebase Storage**: fotos/documentos (evidencias de campo, imágenes de cliente).
- **Cloud Functions (2ª gen)**: roles, invitaciones, validaciones, automatizaciones.
- **Firebase Hosting o App Hosting**: despliegue del frontend web.
- (Opcional) **Cloud Scheduler + Export**: backups automáticos de Firestore a GCS.

## 3) Recomendación móvil (para reutilizar lo que ya tienes)
### Opción recomendada: **React Native + Expo**
Motivo: ya tienes un proyecto **React + TypeScript**, así que reusas:
- Tipos (`Client`, `Dosification`, etc.), validaciones (Zod), utilidades, y gran parte de lógica.
- Con Expo, cámara/GPS/almacenamiento local y deployments son más rápidos.

Qué NO se reusa 1:1:
- UI web (Tailwind/shadcn) y Leaflet. En móvil se usa **React Native UI** y mapa con `react-native-maps` o Mapbox.

Alternativa (si quieres máximo reuso de UI): **PWA**
- Reusa casi todo el frontend actual.
- Limitaciones: offline avanzado + background uploads + UX de campo en iOS puede ser más frágil.

Conclusión: Para “campo offline” serio, **Expo/React Native** es la mejor ruta.

## 4) Modelo multi-tenant (varios usuarios, varias empresas)
Se recomienda organizar todo por **organización**.

Conceptos:
- `organization`: empresa/agencia que usa la app.
- `member`: usuario interno asociado a una organización con un rol.
- `client`: contribuyente/cliente agrícola.
- `clientUser`: usuario del portal (cliente final) vinculado a un `client`.

Roles sugeridos:
- `orgAdmin`: configura, invita usuarios, ve todo.
- `staff`: gestión interna completa (sin administración de roles).
- `field`: operaciones de campo (crear visitas, fotos, ubicación, notas; acceso acotado).
- `client`: portal (solo su ficha, pedidos, reportes autorizados).

## 5) Esquema de datos (Firestore)
> Nota: usar timestamps server-side y campos de auditoría.

Colecciones principales:
- `organizations/{orgId}`
  - `name`, `createdAt`, `ownerUid`
- `organizations/{orgId}/members/{uid}`
  - `role`, `status`, `createdAt`
- `organizations/{orgId}/clients/{clientId}`
  - `name`, `ruc`, `contact`, `phone`, `email`, `status`, `cropType`, `hectares`
  - `location: { lat, lng }`, `address`, `region`, `city`
  - `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- `organizations/{orgId}/clients/{clientId}/photos/{photoId}`
  - `storagePath`, `downloadUrl` (opcional), `description`, `createdAt`, `createdBy`
- `organizations/{orgId}/orders/{orderId}`
  - `clientId`, `items[]`, `status: draft|submitted|approved|rejected|fulfilled`
  - `createdAt`, `createdBy`, `updatedAt`
- `organizations/{orgId}/inventory/{productId}`
- `organizations/{orgId}/dosifications/{dosificationId}`
- (Opcional) `organizations/{orgId}/events/{eventId}` (auditoría / timeline)

Patrones importantes:
- Evitar “un solo documento muy editado por muchos” para reducir conflictos offline.
- Preferir **eventos** y **subcolecciones** para operaciones de campo (visitas, notas, aplicaciones).

## 6) Autenticación y “portal”
Flujos:
- **Interno**: Auth → carga `member` → decide permisos y navegación.
- **Cliente portal**:
  - Opción A: usuario cliente se crea con invitación (email) y se vincula a un `clientId`.
  - Opción B: “self-signup” controlado, luego staff aprueba/vincula.

Recomendado:
- Roles internos con **Custom Claims** para que no puedan alterarse desde el frontend.
- Vínculo cliente↔usuario en Firestore para reglas simples.

## 7) Reglas de seguridad (Firestore/Storage)
Principios:
- Deny-by-default.
- Acceso por `orgId` + rol.
- Cliente portal: acceso **solo** a su `clientId` y a sus `orders`.

Ejemplos de permisos:
- `orgAdmin/staff`: CRUD sobre `clients`, `inventory`, `dosifications`, `orders`.
- `field`: crear `events`, subir `photos`, actualizar `location` (según necesidad).
- `client`: leer su `client` + crear/leer sus `orders`.

Storage:
- Rutas por org y client: `orgs/{orgId}/clients/{clientId}/photos/{photoId}`.
- Reglas: solo roles autorizados y/o el cliente dueño.

## 8) Offline-first (móvil de campo)
Objetivo: que la app funcione sin señal.

Estrategia:
- Firestore offline + cola de escrituras.
- Cambios de campo como **eventos** (append-only) cuando sea posible.
- Para ubicación:
  - Guardar `location` en el documento del cliente (última ubicación) + opcional `locations` (histórico).

Fotos offline:
- Guardar la imagen localmente.
- Crear en Firestore un registro “pendiente” (con metadata).
- Cuando haya internet: subir a Storage → actualizar Firestore con `storagePath`.

Conflictos:
- Minimizar edición concurrente del mismo doc.
- Para campos críticos, usar un “owner” de edición o revisar cambios en UI.

## 9) Backend (Cloud Functions)
Casos donde SÍ conviene backend:
- Asignar roles (custom claims) y vincular usuarios a org/client.
- Aprobación de pedidos.
- Automatizaciones (recordatorios, tareas programadas).
- Validaciones sensibles (evitar manipulación client-side).

## 10) Despliegue
Web:
- Build Vite → deploy en Firebase Hosting/App Hosting.

Móvil:
- Expo EAS Build (Android/iOS) + canales (dev/staging/prod).

Ambientes:
- `dev` / `staging` / `prod` con proyectos Firebase separados.

## 11) Observabilidad y mantenimiento
- Logs de Functions.
- Auditoría en Firestore (createdAt/By, updatedAt/By, events).
- Backups programados (export Firestore a GCS).

## 12) Roadmap por fases (recomendado)
### Fase 1 — Base multiusuario (1–2 semanas)
- Firebase Auth integrado en web.
- Modelo `organizations/members`.
- Reglas mínimas de Firestore/Storage.
- Migrar persistencia actual (si hoy es local) a Firestore.

### Fase 2 — Portal de clientes + pedidos (2–4 semanas)
- Vistas portal (ficha, ubicación, reportes permitidos).
- `orders` end-to-end (crear, estados, aprobación).
- Functions para invitaciones/roles.

### Fase 3 — App móvil offline (3–6 semanas)
- Expo app mínima: login + lista clientes + detalle + capturar ubicación + fotos.
- Sync de fotos en background cuando haya red.
- UX de conflictos y colas.

### Fase 4 — Hardening (continuo)
- Backups, monitoreo, límites, reglas finas, rendimiento.

## 13) Decisiones pendientes (para cerrar diseño)
1) ¿Habrá múltiples organizaciones reales (multi-tenant) o solo una “empresa”? (si es una sola, se simplifica)
2) ¿Pedido es solo “solicitud” o implica pagos/facturación?
3) ¿Requieren trazabilidad legal/auditoría fuerte (no editable) para ciertas operaciones?
