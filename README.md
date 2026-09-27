# Calculadora de precios para uñas

Página web para calcular cuánto cobrar por cada servicio de uñas según materiales, tiempo, gastos fijos y ganancia.

**Fórmula:** Precio = Materiales + (Minutos ÷ 60 × tarifa por hora) + Gastos fijos por servicio + Margen + Piedras

## Estructura

```
index.html        Página (pestañas Calcular, Materiales, Servicios, Ajustes)
css/estilos.css   Diseño
js/datos.js       Precios y servicios de ejemplo (valores iniciales)
js/app.js         Lógica de la calculadora
img/logo.jpeg     Logo de Bloom Studio
```

Los cambios que se hacen desde la página se guardan en el navegador del dispositivo.
Usa "Descargar respaldo" en Ajustes para no perderlos.

## Publicar en GitHub Pages

1. Crear un repositorio llamado `calculadora-unas` y subir estos archivos.
2. En el repositorio: Settings → Pages → Branch: `main` / `(root)` → Save.
3. Queda en `https://danteefredqg-ops.github.io/calculadora-unas/`
