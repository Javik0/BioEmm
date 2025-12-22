# Branding Assets - BioEmm

Esta carpeta contiene los recursos de marca de la empresa.

## Estructura recomendada:

```
branding/
├── logo.png          # Logo principal (recomendado: 200x60 px o similar)
├── logo-dark.png     # Logo para fondo oscuro (opcional)
├── logo-icon.png     # Ícono solo (cuadrado, ej: 64x64 px)
├── favicon.ico       # Ícono del navegador (mover a /public)
└── README.md         # Este archivo
```

## Formatos recomendados:

- **Logo principal**: PNG con fondo transparente, máximo 500KB
- **Favicon**: .ico o .png de 32x32 o 64x64 px
- **Fondos**: JPG o PNG, optimizados para web

## Cómo usar:

### Logo en el header:
```tsx
import logo from '@/assets/branding/logo.png'

<img src={logo} alt="BioEmm" className="h-10" />
```

### Favicon:
Copia tu favicon.ico a la carpeta `/public/` y se usará automáticamente.

## Notas:
- Los archivos en `/src/assets/` se procesan por Vite (optimización)
- Los archivos en `/public/` se copian tal cual al build
