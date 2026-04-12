'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MirrorState {
  mode: 'dashboard' | 'youtube'
  youtubeId: string | null
  message: string
  weatherCity: string
}

interface CitySuggestion {
  name: string
  state?: string
  country: string
  lat: number
  lon: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractYouTubeId(input: string): string | null {
  if (!input.trim()) return null
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const pattern of patterns) {
    const match = input.trim().match(pattern)
    if (match) return match[1]
  }
  return null
}

function formatCityLabel(c: CitySuggestion) {
  return [c.name, c.state, c.country].filter(Boolean).join(', ')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
        connected
          ? 'bg-green-900/40 text-green-400 border-green-800'
          : 'bg-red-900/40 text-red-400 border-red-800'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      {connected ? 'Espejo conectado' : 'Sin conexión'}
    </span>
  )
}

// ─── CitySearch ──────────────────────────────────────────────────────────────

function CitySearch({
  current,
  onApply,
}: {
  current: string
  onApply: (city: string) => void
}) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced geocoding search — uses OWM geo API if key available,
  // otherwise falls back to Open-Meteo (free, no key required)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        let results: CitySuggestion[] = []

        if (apiKey) {
          // OpenWeatherMap Geocoding API
          const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
          const data: Array<{ name: string; state?: string; country: string; lat: number; lon: number }> =
            await fetch(url).then((r) => r.json())
          results = data.map((d) => ({ name: d.name, state: d.state, country: d.country, lat: d.lat, lon: d.lon }))
        } else {
          // Open-Meteo geocoding (free fallback, no key needed)
          const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`
          const data: { results?: Array<{ name: string; admin1?: string; country_code: string; latitude: number; longitude: number }> } =
            await fetch(url).then((r) => r.json())
          results = (data.results ?? []).map((d) => ({
            name: d.name,
            state: d.admin1,
            country: d.country_code,
            lat: d.latitude,
            lon: d.longitude,
          }))
        }

        setSuggestions(results)
        setOpen(results.length > 0)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, apiKey])

  const handleSelect = (c: CitySuggestion) => {
    // Store as "CityName,CC" — works with OWM current weather endpoint
    const cityStr = `${c.name},${c.country}`
    onApply(cityStr)
    setQuery('')
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Ciudad actual: ${current}`}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                     placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
        />
        {loading && (
          <div className="flex items-center px-3">
            <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
          {suggestions.map((c, i) => (
            <li key={`${c.lat}-${c.lon}-${i}`}>
              <button
                onMouseDown={(e) => e.preventDefault()} // keep input focused
                onClick={() => handleSelect(c)}
                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-gray-700 transition-colors flex items-center justify-between gap-2"
              >
                <span>{formatCityLabel(c)}</span>
                <span className="text-xs text-gray-500 shrink-0">
                  {c.lat.toFixed(1)}, {c.lon.toFixed(1)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!apiKey && (
        <p className="text-xs text-amber-600 mt-1.5 ml-1">
          Sin API key — usando geocoding gratuito (Open-Meteo). Configura{' '}
          <code className="text-amber-500">NEXT_PUBLIC_WEATHER_API_KEY</code> para mayor precisión.
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter()

  const [state, setState] = useState<MirrorState>({
    mode: 'dashboard',
    youtubeId: null,
    message: '¡Bienvenido!',
    weatherCity: 'Madrid,ES',
  })
  const [connected, setConnected] = useState(false)

  const [youtubeInput, setYoutubeInput] = useState('')
  const [youtubeError, setYoutubeError] = useState('')
  const [messageInput, setMessageInput] = useState('¡Bienvenido!')

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket()
    setConnected(socket.connected)

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    const onState = (newState: MirrorState) => {
      setState(newState)
      setMessageInput(newState.message)
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('mirror:state', onState)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('mirror:state', onState)
    }
  }, [])

  // ── Emit helper ─────────────────────────────────────────────────────────────
  const updateMirror = useCallback((update: Partial<MirrorState>) => {
    getSocket().emit('mirror:update', update)
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePlayYouTube = () => {
    const id = extractYouTubeId(youtubeInput)
    if (!id) { setYoutubeError('URL o ID de vídeo no válido'); return }
    setYoutubeError('')
    updateMirror({ mode: 'youtube', youtubeId: id })
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">🪞 Magic Mirror</span>
            <StatusBadge connected={connected} />
          </div>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* ── Mode Selector ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Modo actual</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => updateMirror({ mode: 'dashboard', youtubeId: null })}
              className={`py-3.5 rounded-xl font-medium text-sm transition-all ${
                state.mode === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => state.youtubeId && updateMirror({ mode: 'youtube' })}
              disabled={!state.youtubeId}
              title={!state.youtubeId ? 'Primero carga un vídeo' : undefined}
              className={`py-3.5 rounded-xl font-medium text-sm transition-all ${
                state.mode === 'youtube'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-950'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              ▶ YouTube
            </button>
          </div>
        </section>

        {/* ── Weather City ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Ciudad del tiempo</h2>
          <CitySearch
            current={state.weatherCity}
            onApply={(city) => updateMirror({ weatherCity: city })}
          />
          <p className="text-xs text-gray-600 mt-3">
            Mostrando:{' '}
            <span className="text-gray-400 font-medium">{state.weatherCity}</span>
          </p>
        </section>

        {/* ── YouTube Control ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Control de YouTube</h2>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={youtubeInput}
                onChange={(e) => { setYoutubeInput(e.target.value); setYoutubeError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayYouTube()}
                placeholder="Pega la URL o ID del vídeo…"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                           placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors text-sm"
              />
              {youtubeError && <p className="text-red-400 text-xs mt-1.5 ml-1">{youtubeError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePlayYouTube}
                className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                ▶ Reproducir
              </button>
              <button
                onClick={() => updateMirror({ mode: 'dashboard', youtubeId: null })}
                className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                ⏹ Detener
              </button>
            </div>
            {state.youtubeId && (
              <p className="text-xs text-gray-600">
                ID activo: <code className="text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">{state.youtubeId}</code>
              </p>
            )}
          </div>
        </section>

        {/* ── Message Control ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Mensaje del dashboard</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && messageInput.trim() && updateMirror({ message: messageInput.trim() })}
              placeholder="Escribe un mensaje para el espejo…"
              maxLength={120}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white
                         placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <button
              onClick={() => messageInput.trim() && updateMirror({ message: messageInput.trim() })}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-sm transition-colors"
            >
              Enviar al espejo
            </button>
          </div>
        </section>

        {/* ── Live State Debug ── */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Estado en vivo</h2>
          <pre className="text-xs text-gray-400 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(state, null, 2)}
          </pre>
        </section>
      </main>
    </div>
  )
}
