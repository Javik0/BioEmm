# Arquitectura móvil (offline-first) — React Native + Expo + Firebase

Fecha: 2025-12-22

## 1) Objetivo
Crear una app móvil para uso en campo que:
- Funcione **offline-first** (captura sin señal y sincroniza al volver internet).
- Permita gestión de datos clave: clientes, ubicación, eventos de campo, fotos, notas y (opcional) pedidos.
- Comparta el mismo backend que la web: **Firebase Auth + Firestore + Storage**.

## 2) Stack recomendado
- **React Native + Expo (TypeScript)**
- **Firebase Auth** (mismo proyecto que web)
- **Firestore** como DB principal
- **Firebase Storage** para fotos
- **Expo Modules**:
  - `expo-location` (GPS)
  - `expo-image-picker` o `expo-camera` (fotos)
  - `expo-file-system` (cola de uploads)
  - `expo-secure-store` (tokens/flags locales)
  - `@react-native-community/netinfo` (estado de red)

## 3) Reutilización desde la web
Se puede reusar bastante, pero con límites:
- ✅ Tipos TypeScript (`src/types`) → mover a un paquete compartido (monorepo) o copiar inicialmente.
- ✅ Reglas de negocio (validaciones, normalización de datos, helpers).
- ✅ Estructura Firestore (colecciones, permisos, roles).
- ❌ UI (Tailwind/shadcn) no se reutiliza en RN.
- ❌ Leaflet no aplica en RN.

Recomendación práctica:
- Crear un workspace monorepo: `apps/web`, `apps/mobile`, `packages/shared`.
- `packages/shared` contiene tipos/validaciones/schemas y funciones puras.

## 4) Modelo de datos (compatibilidad web/móvil)
El móvil debe operar sobre las mismas colecciones:
- `organizations/{orgId}/clients/{clientId}`
- `organizations/{orgId}/events/{eventId}` (recomendado)
- `organizations/{orgId}/orders/{orderId}` (si el móvil crea pedidos)
- `orgs/{orgId}/clients/{clientId}/photos/{photoId}` (metadata)

### Patrón recomendado: “eventos” para campo
Para minimizar conflictos offline:
- En lugar de editar mucho el documento `client`, el móvil crea **eventos**:
  - `visit_created`, `note_added`, `photo_added`, `dosification_applied`, `location_updated`.
- El `client` mantiene el estado actual (ej. `location` última), pero el historial vive en `events`.

## 5) Offline-first: estrategia de sincronización
Firestore en móvil:
- Firestore SDK móvil soporta cache offline y cola de escrituras.
- Para evitar sorpresas:
  - Diseñar documentos pequeños.
  - Evitar campos muy editados por múltiples usuarios.

### Conflictos
Regla general:
- Firestore resuelve por “última escritura” a nivel documento.

Para reducir conflictos:
- Guardar cambios de campo como **nuevos documentos** (eventos) en vez de editar un doc compartido.
- Cuando haya que editar un doc (ej. `client.location`):
  - Aceptar “última ubicación” como fuente de verdad.
  - Mantener `locationHistory` en subcolección/eventos.

## 6) Fotos en campo (offline)
Problema: Storage no sube sin red.

Solución (cola de uploads):
1) Capturar foto → guardar local `file://...`.
2) Crear un doc Firestore `photos/{photoId}` con estado `pendingUpload` y metadata mínima.
3) Guardar en almacenamiento local una cola: `{photoId, localUri, storagePath}`.
4) Cuando haya red:
   - Subir a Storage.
   - Actualizar Firestore: `status=uploaded`, `storagePath`, `downloadUrl` (si se usa), `uploadedAt`.

Notas:
- Usar NetInfo para detectar reconexión.
- Reintentos exponenciales.

## 7) Mapa y geolocalización
- Mapa: `react-native-maps` (Google/Apple) o Mapbox.
- Selección ubicación:
  - Botón “usar mi ubicación” (GPS).
  - Opción “marcar en mapa” (tap en mapa).
- Al guardar:
  - Actualizar `client.location` (última).
  - Crear evento `location_updated`.

## 8) Autenticación y roles
- Auth: Email/Password o Google/Apple según necesidad.
- Después de login:
  - Resolver `orgId` y rol desde `organizations/{orgId}/members/{uid}` o custom claims.

Para portal cliente (móvil o web):
- Usuario con rol `client` solo ve su `clientId` y pedidos.

## 9) Seguridad
- Reglas Firestore/Storage son la “muralla”.
- El móvil debe asumir red hostil.

Buenas prácticas:
- No confiar en datos locales.
- Validar permisos por org/rol.
- Custom Claims para roles internos.

## 10) UX mínima (pantallas)
Field app (interno):
- Login
- Selector de organización (si aplica)
- Lista clientes (offline cache)
- Detalle cliente
  - Ver datos básicos
  - Ubicación: ver en mapa + capturar nueva
  - Fotos: lista + capturar + cola de subida
  - Timeline de eventos
- (Opcional) Crear evento/dosificación

Portal cliente (si se hace móvil):
- Login
- Mi ficha
- Mis pedidos
- Crear pedido

## 11) Builds y despliegue
- Expo EAS:
  - `development` (para pruebas)
  - `preview/staging`
  - `production`

Ambientes Firebase separados:
- `dev`, `staging`, `prod` (recomendado).

## 12) Roadmap móvil (práctico)
1) App Expo básica + Auth
2) Lectura de clientes (Firestore) + cache offline
3) Detalle + actualizar ubicación
4) Fotos: captura local + cola + subida
5) Eventos de campo (append-only)
6) Hardening: reintentos, observabilidad, límites

## 13) Decisiones pendientes
- ¿Mapa: Google Maps vs Mapbox?
- ¿Se requiere trabajo en background (uploads) estricto en iOS?
- ¿Qué operaciones se habilitan offline (solo captura vs también edición)?
