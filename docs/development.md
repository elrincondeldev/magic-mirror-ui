# 🛠 Guía de Desarrollo Local

## Preparación del Entorno

Para trabajar en este proyecto localmente:

1. Clona el repositorio:
   ```bash
   git clone https://github.com/elrincondeldev/magic-mirror-ui.git
   cd magic-mirror-ui
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env.local` en la raíz del proyecto:
   ```env
   NEXT_PUBLIC_WEATHER_API_KEY=tu_api_key_aquí
   NEXT_PUBLIC_WEATHER_CITY="Madrid,ES"
   ```

## Flujo de Trabajo

- **npm run dev**: Inicia el servidor de desarrollo personalizado (`server.js`). Esto permite recarga en caliente (HMR) tanto de Next.js como de los sockets.
- **npm run build**: Compila la aplicación Next.js para producción.
- **npm run start**: Inicia la aplicación en modo producción utilizando el servidor personalizado.

## Componentes Clave

- **/app/mirror/page.tsx**: Contiene la lógica del reloj, el clima y el reproductor de YouTube.
- **/app/admin/page.tsx**: Contiene el panel de control con el buscador de ciudades por geolocalización.
- **/lib/socket.ts**: Instancia compartida del socket del cliente para evitar conexiones múltiples.

## Sockets en Desarrollo

El servidor de sockets se ejecuta en el mismo puerto que la aplicación Next.js (por defecto 3000). Al usar `server.js` en desarrollo, Socket.io se integra automáticamente con el middleware de Next.js.

## Clima y Geolocalización

- **Búsqueda de ciudades**: El componente `CitySearch` utiliza la API de geocodificación de OpenWeatherMap si hay una clave presente. Si no, utiliza el servicio gratuito de **Open-Meteo**.
- **Clima**: El componente `Weather` muestra los datos climáticos actuales. Al igual que el buscador, tiene un fallback automático a Open-Meteo si no hay API Key configurada.