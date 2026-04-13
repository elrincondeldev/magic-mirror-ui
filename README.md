# 🪞 Magic Mirror UI

Una interfaz moderna, minimalista y personalizable para espejos inteligentes (Smart Mirrors), construida con **Next.js 14**, **Tailwind CSS** y **Socket.io**.

Este proyecto permite transformar cualquier pantalla en un espejo inteligente con sincronización en tiempo real desde un panel de administración remoto.

![Admin & Mirror](https://github.com/elrincondeldev/magic-mirror-ui/raw/main/public/preview.png) *(Placeholder: Añade aquí una captura de pantalla)*

## ✨ Características

- **Sincronización en tiempo real**: Los cambios realizados en el panel de administración se reflejan instantáneamente en el espejo sin necesidad de recargar.
- **Modos de visualización**:
  - **📊 Dashboard**: Reloj digital, fecha, clima actual y mensajes personalizados.
  - **▶ YouTube**: Reproducción remota de vídeos (ideal para música, noticias o ambiente).
- **Control del clima**: Soporte para **OpenWeatherMap** (con API Key) y **Open-Meteo** (gratuito, sin configuración).
- **Panel de administración**: Protegido por autenticación simple para gestionar el espejo desde cualquier dispositivo.
- **Modo Kiosk**: Interfaz optimizada para Raspberry Pi y otros dispositivos, ocultando el cursor y maximizando el espacio.
- **Multi-plataforma**: Preparado para desplegarse en Docker, Fly.io, Railway o localmente.

## 🚀 Inicio Rápido

### Requisitos previos

- Node.js 18+ instalado.
- (Opcional) Una API Key de [OpenWeatherMap](https://openweathermap.org/api) para datos climáticos precisos.

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/elrincondeldev/magic-mirror-ui.git
   cd magic-mirror-ui
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno (opcional):
   Crea un archivo `.env.local`:
   ```env
   NEXT_PUBLIC_WEATHER_API_KEY=tu_api_key_aquí
   NEXT_PUBLIC_WEATHER_CITY="Madrid,ES"
   ```

4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

5. Accede a las interfaces:
   - **Espejo**: [http://localhost:3000/mirror](http://localhost:3000/mirror)
   - **Administración**: [http://localhost:3000/admin](http://localhost:3000/admin) (Usuario: `admin`, Contraseña: `admin123`)

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Real-time**: Socket.io (servidor personalizado en Node.js)
- **Clima**: Open-Meteo API & OpenWeatherMap API

## 📂 Estructura del Proyecto

- `/app/mirror`: La interfaz que se muestra en el espejo.
- `/app/admin`: El panel de control remoto.
- `/app/login`: Sistema de acceso para el panel de administración.
- `/lib/socket.ts`: Cliente socket compartido.
- `server.js`: Servidor custom que integra Next.js y Socket.io.

## 📦 Despliegue

El proyecto incluye configuraciones listas para:

- **Docker**: `Dockerfile` incluido.
- **Railway**: `railway.toml` incluido.
- **Fly.io**: `fly.toml` incluido.

Consulta la [guía de despliegue](./docs/deployment.md) para más detalles.

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Siéntete libre de usarlo, modificarlo y compartirlo.

---
Creado con ❤️ por [El Rincón Del Dev](https://github.com/elrincondeldev).