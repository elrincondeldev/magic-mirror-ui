'use client'

import { useEffect, useState, useRef } from 'react'
import { getSocket } from '@/lib/socket'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MirrorState {
  mode: 'dashboard' | 'youtube'
  youtubeId: string | null
  message: string
  weatherCity: string
}

interface WeatherData {
  temp: number
  description: string
  icon: string
  city: string
}

// ─── Clock ───────────────────────────────────────────────────────────────────

function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const date = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="text-center select-none">
      <div className="text-[clamp(4rem,12vw,9rem)] font-thin tracking-widest text-white leading-none tabular-nums">
        {time}
      </div>
      <div className="text-[clamp(1rem,2.5vw,1.75rem)] font-light text-gray-400 mt-3 capitalize">
        {date}
      </div>
    </div>
  )
}

// ─── Weather helpers ──────────────────────────────────────────────────────────

// WMO weather codes → Spanish description + emoji (used with Open-Meteo fallback)
const WMO: Record<number, [string, string]> = {
  0:  ['Despejado', '☀️'],
  1:  ['Mayormente despejado', '🌤️'],
  2:  ['Parcialmente nublado', '⛅'],
  3:  ['Nublado', '☁️'],
  45: ['Niebla', '🌫️'],
  48: ['Niebla con escarcha', '🌫️'],
  51: ['Llovizna ligera', '🌦️'],
  53: ['Llovizna moderada', '🌦️'],
  55: ['Llovizna intensa', '🌧️'],
  61: ['Lluvia ligera', '🌧️'],
  63: ['Lluvia moderada', '🌧️'],
  65: ['Lluvia intensa', '🌧️'],
  71: ['Nieve ligera', '🌨️'],
  73: ['Nieve moderada', '❄️'],
  75: ['Nieve intensa', '❄️'],
  80: ['Chubascos ligeros', '🌦️'],
  81: ['Chubascos moderados', '🌧️'],
  82: ['Chubascos intensos', '🌧️'],
  95: ['Tormenta', '⛈️'],
  96: ['Tormenta con granizo', '⛈️'],
  99: ['Tormenta con granizo fuerte', '⛈️'],
}

// Fetches real data from Open-Meteo (free, no API key needed).
// First geocodes the city name to lat/lon, then queries the weather endpoint.
async function fetchOpenMeteo(city: string): Promise<WeatherData> {
  // Strip country code if present: "Madrid,ES" → "Madrid"
  const cityName = city.split(',')[0].trim()

  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=es&format=json`
  )
  const geoData = await geoRes.json()
  const loc = geoData.results?.[0]
  if (!loc) throw new Error('Ciudad no encontrada')

  const wxRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&current=temperature_2m,weather_code&timezone=auto`
  )
  const wxData = await wxRes.json()
  const current = wxData.current
  const [description, emoji] = WMO[current.weather_code] ?? ['Desconocido', '🌡️']

  return {
    temp: Math.round(current.temperature_2m),
    description,
    icon: emoji,   // emoji string, not an OWM icon code
    city: loc.name,
  }
}

async function fetchOWM(city: string, apiKey: string): Promise<WeatherData> {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}` +
    `&appid=${apiKey}&units=metric&lang=es`
  const data = await fetch(url).then((r) => r.json())
  if (data.cod !== 200) throw new Error(data.message)
  return {
    temp: Math.round(data.main.temp),
    description: data.weather[0].description,
    icon: data.weather[0].icon, // OWM icon code e.g. "01d"
    city: data.name,
  }
}

// ─── Weather ─────────────────────────────────────────────────────────────────

function Weather({ city }: { city: string }) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [error, setError] = useState(false)
  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

  useEffect(() => {
    setError(false)
    setWeather(null)

    const doFetch = () =>
      (apiKey ? fetchOWM(city, apiKey) : fetchOpenMeteo(city))
        .then(setWeather)
        .catch(() => setError(true))

    doFetch()
    const id = setInterval(doFetch, 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [city, apiKey])

  if (error) return <div className="text-gray-600 text-sm select-none">Sin datos del clima</div>
  if (!weather) return null

  // OWM returns icon codes like "01d"; Open-Meteo path puts an emoji string
  const isEmoji = weather.icon.length <= 4 // rough heuristic

  return (
    <div className="select-none">
      <div className="flex items-center gap-1">
        {isEmoji ? (
          <span className="text-5xl leading-none">{weather.icon}</span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
            alt={weather.description}
            className="w-14 h-14 -ml-2"
          />
        )}
        <div className="text-[clamp(2.5rem,7vw,5rem)] font-thin text-white leading-none">
          {weather.temp}°
        </div>
      </div>
      <div className="text-[clamp(0.9rem,1.8vw,1.25rem)] text-gray-400 mt-1 capitalize">
        {weather.description}
      </div>
      <div className="text-[clamp(0.75rem,1.4vw,1rem)] text-gray-600 mt-0.5">
        {weather.city}
      </div>
    </div>
  )
}

// ─── YouTube Player ───────────────────────────────────────────────────────────
//
// Uses the YouTube IFrame Player API instead of a plain <iframe> because browsers
// block autoplay with audio unless the user has recently interacted with the page.
// Strategy: start muted (autoplay always allowed) → unmute 500 ms after onReady fires.
// On the Raspberry Pi kiosk launched with --autoplay-policy=no-user-gesture-required
// the muted start is still harmless and the unmute fires immediately.

/* eslint-disable @typescript-eslint/no-explicit-any */
function YouTubePlayer({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let player: any = null

    function initPlayer() {
      if (!containerRef.current) return

      player = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,          // must start muted to satisfy autoplay policy
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady(event: any) {
            event.target.playVideo()
            // Unmute after a short delay — browser allows this because playback has started
            setTimeout(() => {
              event.target.unMute()
              event.target.setVolume(100)
            }, 500)
          },
        },
      })
    }

    if ((window as any).YT?.Player) {
      // API already loaded (e.g. user played a second video)
      initPlayer()
    } else {
      // Inject the API script once
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
      ;(window as any).onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      try { player?.destroy() } catch { /* ignore */ }
      player = null
      if ((window as any).onYouTubeIframeAPIReady === initPlayer) {
        delete (window as any).onYouTubeIframeAPIReady
      }
    }
  }, [videoId])

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* The YT API replaces this div with its own <iframe> */}
      <div ref={containerRef} className="w-full h-full" style={{ width: '100%', height: '100vh' }} />
    </div>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MirrorPage() {
  const [state, setState] = useState<MirrorState>({
    mode: 'dashboard',
    youtubeId: null,
    message: '¡Bienvenido!',
    weatherCity: 'Madrid,ES',
  })

  useEffect(() => {
    const socket = getSocket()

    const onState = (newState: MirrorState) => setState(newState)
    socket.on('mirror:state', onState)

    return () => {
      socket.off('mirror:state', onState)
    }
  }, [])

  return (
    // cursor-none hides the mouse pointer — essential for kiosk mode
    <main className="min-h-screen bg-black text-white overflow-hidden cursor-none select-none">
      {/* YouTube overlay — rendered on top when in youtube mode */}
      {state.mode === 'youtube' && state.youtubeId && (
        <YouTubePlayer videoId={state.youtubeId} />
      )}

      {/* Dashboard — always rendered, hidden behind YouTube overlay */}
      <div className="relative min-h-screen flex flex-col p-8 md:p-12">
        {/* Centre: Clock */}
        <div className="flex-1 flex items-center justify-center">
          <Clock />
        </div>

        {/* Bottom row: Weather (left) + Message (right) */}
        <div className="flex items-end justify-between gap-4">
          <Weather city={state.weatherCity} />
          <p className="text-right text-[clamp(1rem,2vw,1.5rem)] font-light text-gray-300 italic max-w-md">
            {state.message}
          </p>
        </div>
      </div>
    </main>
  )
}
