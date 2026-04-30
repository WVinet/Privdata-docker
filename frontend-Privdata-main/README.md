# Privdata FrontEnd ACADÉMICO

## Repositorios de PrivData:

## authService: [Link al repo](https://github.com/WVinet/authservice-PrivData.git)
## organizationService: [Link al repo](https://github.com/miloQ1/organizationService--PrivData.git)
## complianceService: [Link al repo](https://github.com/miloQ1/complianceService-PrivData.git)

# Miembros del equipo:
## Arelis Tovar
## Wilfred Vinet
## Camilo Queupil


## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Librería de UI
- **TypeScript** - Desarrollo con tipos seguros
- **Vite** - Herramienta de construcción ultrarrápidaS
- **React Router v7** - Enrutamiento del lado del cliente

### Gestión de Estado y Obtención de Datos
- **TanStack React Query v5** - Gestión de estado del servidor y caché
- **Axios** - Cliente HTTP
- **React Hook Form** - Manejo de formularios
- **Zod** - Validación de esquemas

### Componentes UI y Estilos
- **Radix UI** - Componentes sin estilos y accesibles
  - Accordion, Dialog, Dropdown, Select, Tabs, Tooltip, etc.
- **Tailwind CSS** - Framework CSS basado en utilidades
- **Lucide React** - Librería de iconos
- **Next Themes** - Cambio de temas (modo oscuro/claro)
- **Sonner** - Notificaciones toast
- **Embla Carousel** - Componente carrusel
- **React Resizable Panels** - Paneles redimensionables

### Utilidades
- **Recharts** - Visualización de datos con gráficos
- **date-fns** - Manipulación de fechas
- **class-variance-authority** - Gestión de variantes de componentes
- **clsx/tailwind-merge** - Composición de clases CSS
- **cmdk** - Componente de menú de comandos
- **Vaul** - Componente drawer

### Desarrollo y Calidad
- **ESLint** - Linting de código
- **TypeScript ESLint** - Linting consciente de tipos
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos de vendedores CSS

### Scripts
```bash
npm run dev        # Inicia servidor de desarrollo en http://localhost:5173
npm run build      # Compila TypeScript y construye para producción
npm run preview    # Vista previa de la construcción de producción
npm run lint       # Ejecuta ESLint



### Características
- ✅ **Autenticación segura** - Sistema de login con pruebas de JWT
- ✅ **Rutas protegidas** - AppLayout verifica estado de autenticación
- ✅ **Gestión de usuarios** - CRUD completo de usuarios
- ✅ **Gestión de datos personales** - Módulo de titulares
- ✅ **Consentimientos GDPR/LOPD** - Gestión de consentimientos de usuarios
- ✅ **Derechos ARCO** - Acceso, rectificación, cancelación y oposición de datos
- ✅ **Auditoría** - Registro y seguimiento de acciones
- ✅ **Portal Titular** - Interfaz dedicada para que los titulares gestionen sus datos, consentimientos y solicitudes ARCO
- ✅ **Tema oscuro/claro** - Soporte completo de temas
- ✅ **Diseño responsivo** - Optimizado para móvil y desktop
- ✅ **Validación de formularios** - Con React Hook Form y Zod
- ✅ **Visualización de datos** - Gráficos con Recharts
- ✅ **Notificaciones** - Toast notifications con Sonner
- ✅ **Componentes accesibles** - Basados en Radix UI

## 📱 Portal del Titular

**Módulo exclusivo para usuarios finales (titulares)** - Accesible en `/portal` sin autenticación de administrador.

### Funcionalidades
- **Inicio (Dashboard)** - Resumen de privacidad con estadísticas de consentimientos, solicitudes y sistemas que usan sus datos
- **Mis Consentimientos** - Visualización y control de consentimientos otorgados, con capacidad de revocar los opcionales
- **Derechos ARCO** - Solicitud interactiva de Acceso, Rectificación, Supresión, Oposición, Portabilidad y Bloqueo temporal
- **Seguimiento** - Estado en tiempo real de solicitudes abiertas y resoluciones con timeline visual de pasos

### Diseño
- Layout con sidebar colapsable optimizado para móvil (drawer)
- Paleta de colores cálida: verde esmeralda profundo + dorado/miel
- Componentes reutilizables con Radix UI y Tailwind CSS
- Transiciones suaves y feedback visual en todas las interacciones

