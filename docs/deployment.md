# 📦 Guía de Despliegue

## Despliegue en Railway (Recomendado)

Railway detectará automáticamente el archivo `railway.toml` y `Dockerfile`. Solo necesitas conectar tu repositorio a un nuevo servicio en Railway.

Asegúrate de configurar las variables de entorno necesarias:
- `NEXT_PUBLIC_WEATHER_API_KEY`: Tu clave de OpenWeatherMap.
- `NEXT_PUBLIC_WEATHER_CITY`: Ciudad por defecto.

## Despliegue con Docker

El proyecto incluye un `Dockerfile` de producción optimizado para Next.js.

1. Construye la imagen:
   ```bash
   docker build -t magic-mirror-ui .
   ```

2. Inicia el contenedor:
   ```bash
   docker run -p 3000:3000 magic-mirror-ui
   ```

## Despliegue en Fly.io

El archivo `fly.toml` está pre-configurado para desplegar una instancia del servidor Node.js.

1. Instala la herramienta de Fly (`flyctl`).
2. Ejecuta:
   ```bash
   fly launch
   fly deploy
   ```

## Despliegue en una Raspberry Pi (Modo Kiosk)

Si planeas usar el espejo en una Raspberry Pi, sigue estos pasos:

1. Instala Node.js y clona el proyecto.
2. Construye el proyecto localmente:
   ```bash
   npm install
   npm run build
   ```
3. Inicia el servidor de producción:
   ```bash
   npm run start
   ```
4. Configura el navegador (Chromium) para abrirse en modo quiosco al iniciar:
   ```bash
   chromium-browser --kiosk --autoplay-policy=no-user-gesture-required http://localhost:3000/mirror
   ```