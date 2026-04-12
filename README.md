# Magic Mirror UI

Aplicación web para un espejo inteligente (Magic Mirror) en Raspberry Pi 4B.

- **`/mirror`** — pantalla del espejo (Chromium en modo kiosk)
- **`/admin`** — panel de control (desde móvil u ordenador)
- Comunicación en tiempo real vía **Socket.io**

---

## Stack

- [Next.js 14](https://nextjs.org) (App Router)
- [Tailwind CSS 3](https://tailwindcss.com)
- [Socket.io 4](https://socket.io)
- [Open-Meteo](https://open-meteo.com) (clima gratuito, sin API key)
- [OpenWeatherMap](https://openweathermap.org) (clima opcional, más preciso)

---

## Instalación

```bash
git clone <repo>
cd magic-mirror-ui
npm install
```

### Variables de entorno (opcionales)

```bash
cp .env.local.example .env.local
```

| Variable | Descripción | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_WEATHER_API_KEY` | API key de OpenWeatherMap | Sin key → usa Open-Meteo gratis |
| `NEXT_PUBLIC_WEATHER_CITY` | Ciudad inicial del clima | `Madrid,ES` |
| `HOST` | Interfaz de red | `0.0.0.0` |
| `PORT` | Puerto | `3000` |

> Sin API key la app funciona igualmente usando Open-Meteo (gratuito, sin registro).

---

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

---

## Credenciales del panel de admin

```
Usuario:    admin
Contraseña: admin123
```

Cámbialas en `app/api/auth/login/route.ts` (variables `ADMIN_USERNAME` / `ADMIN_PASSWORD`).

---

## Despliegue en Raspberry Pi 4B

### 1. Instalar dependencias en la RPi

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Construir y arrancar con PM2

PM2 mantiene el servidor vivo y lo reinicia automáticamente si cae.

```bash
npm install -g pm2
npm run build
pm2 start server.js --name magic-mirror
pm2 startup    # copia y ejecuta el comando que te devuelve
pm2 save
```

### 3. Abrir Chromium en modo kiosk automáticamente

Edita `/etc/xdg/lxsession/LXDE-pi/autostart` y añade al final:

```bash
@sleep 5
@chromium-browser --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-translate \
  --no-first-run \
  --fast \
  --autoplay-policy=no-user-gesture-required \
  http://localhost:3000/mirror
```

> El `sleep 5` da tiempo a que PM2 levante el servidor antes de que Chromium intente conectarse.

### 4. Acceder al panel de control

Desde cualquier dispositivo en la misma red local:

```
http://<IP-de-la-RPi>:3000/admin
```

Para saber la IP de la RPi: `hostname -I`

### Consumo de recursos estimado

| Proceso | RAM | CPU (idle) |
|---|---|---|
| Node.js (Next.js prod) | ~120 MB | < 1% |
| Chromium kiosk | ~350 MB | 2–5% |
| **Total** | **~470 MB** | **~5%** |

> Con 2 GB+ de RAM no hay problema. Nunca usar `npm run dev` en la RPi — consume el doble.

### Consejo: desactivar swap (≥ 2 GB RAM)

Reduce el desgaste de la tarjeta SD:

```bash
sudo systemctl disable dphys-swapfile
```

---

## Acceso remoto (fuera de la red local)

Para acceder al panel `/admin` desde internet sin pagar ningún servicio, usa **Cloudflare Tunnel**.

### Opción A — URL temporal (sin cuenta, para pruebas)

```bash
# En la RPi
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 \
  -o cloudflared && chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

cloudflared tunnel --url http://localhost:3000
```

Genera una URL pública temporal tipo `https://abc-def-123.trycloudflare.com`.

### Opción B — URL fija permanente (cuenta gratuita de Cloudflare)

```bash
cloudflared tunnel login
cloudflared tunnel create magic-mirror
cloudflared tunnel route dns magic-mirror mirror.tudominio.com
cloudflared tunnel run magic-mirror
```

> Socket.io funciona perfectamente con Cloudflare Tunnel porque el servidor sigue corriendo en la RPi — Cloudflare solo actúa como proxy.

---

## Despliegue en servidor cloud (Fly.io)

Si prefieres correr la app en la nube en lugar de en la RPi, Fly.io tiene tier gratuito y soporta WebSockets.

```bash
curl -L https://fly.io/install.sh | sh
fly auth signup
fly launch      # detecta el Dockerfile automáticamente
fly deploy
```

Configuración ya incluida en `fly.toml`. Región por defecto: `mad` (Madrid).

> **Nota:** Vercel **no es compatible** con esta app — es serverless y no soporta procesos persistentes ni WebSockets de Socket.io.

---

## Arquitectura

```
┌─────────────────────────────────────────┐
│           Raspberry Pi 4B               │
│                                         │
│  ┌─────────────┐    ┌────────────────┐  │
│  │  server.js  │    │    Chromium    │  │
│  │  Next.js    │◄───│    /mirror     │  │
│  │  Socket.io  │    │   (kiosk)      │  │
│  └──────┬──────┘    └────────────────┘  │
│         │                               │
└─────────┼───────────────────────────────┘
          │ WebSocket
          │
   Móvil / Ordenador
   http://<IP-RPi>:3000/admin
```

### Eventos Socket.io

| Evento | Dirección | Payload |
|---|---|---|
| `mirror:state` | Servidor → clientes | `MirrorState` completo |
| `mirror:update` | Cliente → servidor | Patch parcial de `MirrorState` |

### MirrorState

```typescript
{
  mode: 'dashboard' | 'youtube'
  youtubeId: string | null
  message: string
  weatherCity: string   // ej. "Madrid,ES"
}
```

---

## Estructura del proyecto

```
magic-mirror-ui/
├── server.js                   # Servidor HTTP + Socket.io
├── middleware.ts                # Protege /admin con cookie de sesión
├── Dockerfile                  # Para despliegue en Fly.io
├── fly.toml                    # Config de Fly.io
├── lib/
│   └── socket.ts               # Singleton socket.io-client
└── app/
    ├── mirror/page.tsx          # Pantalla del espejo
    ├── admin/page.tsx           # Panel de control
    ├── login/page.tsx           # Login
    └── api/auth/
        ├── login/route.ts
        └── logout/route.ts
```
