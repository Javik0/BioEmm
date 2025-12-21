# BioEmm - Sistema de Gestión de Clientes Agrícolas

BioEmm es una plataforma de gestión integral para distribuidoras agrícolas que permite registrar clientes, georreferenciar ubicaciones en mapas interactivos, calcular dosificaciones de productos por hectárea y cultivo, y gestionar la relación comercial de forma profesional.

**Experience Qualities**:
1. **Profesional**: Interfaz limpia y organizada que inspira confianza para uso empresarial diario
2. **Eficiente**: Flujos de trabajo rápidos que permiten registrar clientes y dosificaciones en segundos
3. **Visual**: Mapas y visualizaciones claras que facilitan la toma de decisiones geográficas

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)
- BioEmm integra múltiples sistemas: CRM, georreferenciación, cálculo de dosificaciones, gestión de inventario, y reportería. Requiere navegación entre módulos, persistencia compleja de datos relacionales, y visualizaciones interactivas de mapas.

## Essential Features

### Registro de Clientes
- **Functionality**: Formulario completo para capturar datos del cliente (nombre, contacto, tipo de cultivo, hectáreas, ubicación GPS)
- **Purpose**: Centralizar toda la información comercial de clientes potenciales y activos
- **Trigger**: Click en botón "Nuevo Cliente" en el dashboard principal
- **Progression**: Click botón → Formulario modal → Ingresar datos → Seleccionar ubicación en mapa → Guardar → Cliente aparece en lista y mapa
- **Success criteria**: Cliente guardado correctamente con coordenadas GPS y visible en el mapa interactivo

### Mapa Interactivo de Clientes
- **Functionality**: Visualización geográfica de todos los clientes con marcadores clicables
- **Purpose**: Optimizar rutas de visita, identificar zonas de alta concentración, planificar territorio
- **Trigger**: Vista por defecto del módulo "Clientes"
- **Progression**: Cargar mapa → Renderizar marcadores → Click marcador → Ver ficha cliente → Opción de editar/dosificar
- **Success criteria**: Todos los clientes visibles en mapa, marcadores interactivos, navegación fluida

### Sistema de Dosificaciones
- **Functionality**: Calculadora que genera recomendaciones de productos según hectáreas, cultivo y tipo de aplicación
- **Purpose**: Estandarizar prescripciones técnicas y optimizar uso de productos
- **Trigger**: Botón "Nueva Dosificación" desde ficha de cliente
- **Progression**: Seleccionar cliente → Ingresar hectáreas → Seleccionar cultivo → Elegir productos → Sistema calcula cantidades → Guardar dosificación → Genera registro auditable
- **Success criteria**: Cálculos precisos, historial de dosificaciones por cliente, exportable

### Dashboard de Clientes
- **Functionality**: Vista unificada con estadísticas, lista filtrable y acciones rápidas
- **Purpose**: Proveer panorama completo del estado comercial y facilitar acceso rápido
- **Trigger**: Pantalla principal al abrir la app
- **Progression**: Cargar dashboard → Ver métricas (total clientes, hectáreas gestionadas) → Filtrar por cultivo/zona → Acceder a cliente específico
- **Success criteria**: Carga rápida (<2s), búsqueda instantánea, navegación intuitiva

## Edge Case Handling
- **Sin ubicación GPS**: Permitir registro sin coordenadas, marcar como "pendiente georreferenciación"
- **Dosificación sin stock**: Alertar si producto no está disponible, permitir guardar como "pendiente"
- **Duplicados**: Validar nombre+teléfono antes de crear, sugerir cliente existente
- **Datos incompletos**: Validación de campos mínimos, permitir guardado parcial como "borrador"
- **Sin conexión (futuro PWA)**: Modo offline con sincronización posterior

## Design Direction
BioEmm debe transmitir **confianza técnica y profesionalismo agroindustrial**. El diseño refleja la naturaleza del negocio (agricultura, crecimiento, precisión) con paleta terrenal/vegetal, pero manteniendo sofisticación empresarial. Espacios generosos, tipografía clara, iconografía funcional.

## Color Selection

**Paleta agroindustrial moderna con énfasis en verde profesional y tierra**

- **Primary Color (Verde Agrícola)**: `oklch(0.55 0.15 145)` - Verde medio vibrante que evoca crecimiento y agricultura sin ser infantil. Usado en botones principales, encabezados, marcadores de mapa.
- **Secondary Colors**: 
  - Tierra/Brown: `oklch(0.45 0.08 60)` - Para elementos secundarios, badges de cultivos
  - Azul Técnico: `oklch(0.50 0.12 240)` - Para datos numéricos, gráficos, dosificaciones
- **Accent Color (Naranja Cálido)**: `oklch(0.65 0.18 50)` - Para CTAs críticos (Guardar dosificación, Nuevo cliente), alertas de acción requerida
- **Background**: `oklch(0.98 0.005 145)` - Blanco con sutilísimo tinte verde
- **Foreground/Background Pairings**:
  - Primary (Verde `oklch(0.55 0.15 145)`): White text `oklch(1 0 0)` - Ratio 5.2:1 ✓
  - Accent (Naranja `oklch(0.65 0.18 50)`): White text `oklch(1 0 0)` - Ratio 4.9:1 ✓
  - Background (`oklch(0.98 0.005 145)`): Dark text `oklch(0.20 0.01 145)` - Ratio 12.5:1 ✓

## Font Selection

**Tipografía técnica y legible apropiada para dashboards empresariales con datos numéricos frecuentes**

- **Primary Font**: IBM Plex Sans - Familia versátil con excelente legibilidad en pantalla, aire profesional, y números tabulares ideales para tablas de dosificación
- **Monospace (datos/códigos)**: JetBrains Mono - Para IDs de cliente, coordenadas GPS, cantidades exactas

**Typographic Hierarchy**:
- H1 (Título App/Módulo): IBM Plex Sans SemiBold / 32px / -0.5px letter-spacing
- H2 (Secciones Dashboard): IBM Plex Sans Medium / 24px / -0.3px letter-spacing  
- H3 (Tarjetas/Subsecciones): IBM Plex Sans Medium / 18px / normal
- Body (Texto general): IBM Plex Sans Regular / 15px / 1.6 line-height
- Small (Labels/Metadata): IBM Plex Sans Regular / 13px / 0.5px letter-spacing uppercase
- Data (Números/Coords): JetBrains Mono Regular / 14px / tabular-nums

## Animations

Animaciones sutiles y funcionales que refuerzan la sensación de profesionalismo sin ralentizar flujos de trabajo. Transiciones suaves entre vistas (300ms ease-out), aparición de marcadores en mapa con efecto "drop", feedback táctil en botones (scale 0.98), skeleton loaders durante carga de datos. Evitar animaciones decorativas excesivas que puedan percibirse como "juguete".

## Component Selection

**Components**:
- **Dialog**: Para formularios de registro de cliente y dosificación (permite foco sin perder contexto)
- **Card**: Contener fichas de cliente en lista, resúmenes estadísticos en dashboard
- **Input/Textarea/Select**: Formularios de cliente con validación inline
- **Table**: Historial de dosificaciones, lista de productos aplicados
- **Tabs**: Navegación entre módulos (Clientes, Dosificaciones, Productos, Reportes)
- **Badge**: Etiquetar tipo de cultivo, estado de cliente (Activo/Prospecto/Inactivo)
- **Popover**: Quick actions en marcadores de mapa
- **Button**: Variantes Primary (acciones principales), Secondary (cancelar), Destructive (eliminar)
- **Separator**: Dividir secciones en formularios complejos
- **ScrollArea**: Listas largas de clientes

**Customizations**:
- **MapView Component**: Integración de mapa interactivo con Leaflet/MapLibre (custom, no en Shadcn)
- **DosificationCalculator**: Componente especializado con inputs de hectáreas y matriz de productos
- **ClientMarker**: Marcador de mapa personalizado con colores según tipo de cultivo

**States**:
- Buttons: Hover con elevación sutil (+2px shadow), Active con scale(0.98), Loading con spinner
- Inputs: Focus con border accent-color 2px, Error con border destructive + mensaje inline
- Cards: Hover con elevación suave para cards clicables

**Icon Selection (Phosphor Icons)**:
- MapPin: Ubicaciones de clientes
- Plus/PlusCircle: Nuevo cliente, nueva dosificación  
- Flask: Dosificaciones, productos químicos
- ChartLine: Reportes, estadísticas
- Users: Módulo de clientes
- Package: Inventario de productos
- CalendarCheck: Programación de visitas
- Warning: Alertas de stock bajo

**Spacing**:
- Cards: p-6 (24px padding interior)
- Formularios: gap-4 entre campos (16px)
- Dashboard grid: gap-6 (24px entre cards)
- Secciones principales: mb-8 (32px separación)
- Mobile: Reducir a p-4, gap-3

**Mobile**:
- Tabs → Bottom navigation bar en mobile
- Mapa ocupa altura completa, botón flotante para lista de clientes
- Formularios: Inputs a full width, stackear labels arriba
- Dashboard: Cards a 1 columna, estadísticas en carousel horizontal
- Map markers: Tamaño aumentado para mejor toque (44px min)
