import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

// Fix default Leaflet marker icons (broken by bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)['_getIconUrl']
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

const SERIF = "'Fraunces', Georgia, serif"

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  value: string
  onChange: (direccion: string, lat: number, lon: number) => void
  inputClassName?: string
  zonaEnvio?: 'Ciudad' | 'Nacional'
  ciudadReferencia?: string
}

// Tracks map center on drag/move and reports it to parent
function MapCenterTracker({ onMove }: { onMove: (lat: number, lon: number) => void }) {
  useMapEvents({
    move(e) {
      const { lat, lng } = e.target.getCenter()
      onMove(lat, lng)
    },
  })
  return null
}

const DEFAULT_LAT = -31.4167
const DEFAULT_LON = -64.1833

export default function DireccionAutocomplete({ value, onChange, inputClassName, zonaEnvio, ciudadReferencia }: Props) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [pin, setPin] = useState<{ lat: number; lon: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [showMapPicker, setShowMapPicker] = useState(false)
  const [pickerCenter, setPickerCenter] = useState({ lat: DEFAULT_LAT, lon: DEFAULT_LON })
  const [pickerLoading, setPickerLoading] = useState(false)

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setInputValue(v)
    setPin(null)
    setSuggestions([])
    setShowDropdown(false)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!v.trim()) return

    debounceRef.current = setTimeout(async () => {
      try {
        // Fix 1: append ciudadReferencia directly to query string instead of &city=
        const q = zonaEnvio === 'Ciudad' && ciudadReferencia?.trim()
          ? `${v}, ${ciudadReferencia.trim()}`
          : v
        let url =
          `https://nominatim.openstreetmap.org/search` +
          `?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`
        if (zonaEnvio === 'Ciudad') {
          url += `&countrycodes=ar`
        }
        const res = await fetch(url, { headers: { 'Accept-Language': 'es' } })
        const data: NominatimResult[] = await res.json()
        setSuggestions(data)
        setShowDropdown(data.length > 0)
      } catch {
        // network error — silently ignore
      }
    }, 400)
  }

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    setInputValue(result.display_name)
    setPin({ lat, lon })
    setSuggestions([])
    setShowDropdown(false)
    onChange(result.display_name, lat, lon)
  }

  const handlePickerConfirm = async () => {
    setPickerLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pickerCenter.lat}&lon=${pickerCenter.lon}`,
        { headers: { 'Accept-Language': 'es' } }
      )
      const data = await res.json()
      const name: string = data.display_name ?? `${pickerCenter.lat}, ${pickerCenter.lon}`
      setInputValue(name)
      setPin({ lat: pickerCenter.lat, lon: pickerCenter.lon })
      onChange(name, pickerCenter.lat, pickerCenter.lon)
    } catch {
      const name = `${pickerCenter.lat.toFixed(6)}, ${pickerCenter.lon.toFixed(6)}`
      setInputValue(name)
      setPin({ lat: pickerCenter.lat, lon: pickerCenter.lon })
      onChange(name, pickerCenter.lat, pickerCenter.lon)
    }
    setPickerLoading(false)
    setShowMapPicker(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleInput}
        className={inputClassName}
        placeholder="Calle, número, piso / depto"
        autoComplete="off"
        required
      />

      {showDropdown && (
        <ul className="absolute z-50 w-full bg-white border border-[#1a1a1a] mt-[-1px] max-h-60 overflow-y-auto">
          {suggestions.map(r => {
            const [primary, ...rest] = r.display_name.split(',')
            const secondary = rest.join(',').trim()
            return (
              <li
                key={r.place_id}
                onMouseDown={() => handleSelect(r)}
                className="px-3 py-2.5 cursor-pointer border-b border-[#e8e1d4] last:border-0 hover:bg-[#ede5d3] transition-colors"
              >
                <span className="block text-sm text-[#1a1a1a] leading-snug">{primary.trim()}</span>
                {secondary && (
                  <span className="block text-xs text-[#6b6258] leading-snug mt-0.5">{secondary}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        onMouseDown={() => setShowMapPicker(true)}
        className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#6b6258] hover:text-[#73223a] underline underline-offset-4 decoration-1 decoration-[#e8e1d4] hover:decoration-[#73223a] transition-colors"
      >
        Elegir en el mapa
      </button>

      {pin && (
        <div className="mt-2 border border-[#e8e1d4]" style={{ height: '192px' }}>
          <MapContainer
            center={[pin.lat, pin.lon]}
            zoom={16}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Marker position={[pin.lat, pin.lon]} />
          </MapContainer>
        </div>
      )}

      {/* Fullscreen map picker overlay */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" style={{ touchAction: 'none' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 border-b border-[#e8e1d4] flex-shrink-0 bg-[#faf8f4]" style={{ height: '56px' }}>
            <button
              type="button"
              onClick={() => setShowMapPicker(false)}
              className="text-[13px] text-[#1a1a1a] w-20 text-left shrink-0"
              aria-label="Cerrar"
            >
              Cerrar
            </button>
            <h2
              className="flex-1 text-center px-2 text-[#1a1a1a]"
              style={{ fontFamily: SERIF, fontSize: '19px', fontWeight: 400, letterSpacing: '0.01em' }}
            >
              Elegir ubicación
            </h2>
            <div className="w-20 shrink-0" />
          </div>

          {/* Map area */}
          <div className="relative flex-1" style={{ minHeight: 0 }}>
            <MapContainer
              center={[pickerCenter.lat, pickerCenter.lon]}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
              zoomControl
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <MapCenterTracker onMove={(lat, lon) => setPickerCenter({ lat, lon })} />
            </MapContainer>

            {/* Crosshair */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 1000 }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="16" y1="2" x2="16" y2="13" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="16" y1="19" x2="16" y2="30" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="2" y1="16" x2="13" y2="16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="19" y1="16" x2="30" y2="16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="16" cy="16" r="2.5" fill="#1a1a1a" />
                <line x1="16" y1="2" x2="16" y2="13" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                <line x1="16" y1="19" x2="16" y2="30" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                <line x1="2" y1="16" x2="13" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
                <line x1="19" y1="16" x2="30" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex-shrink-0 bg-white border-t border-[#e8e1d4] px-5 py-3">
            <button
              type="button"
              onClick={handlePickerConfirm}
              disabled={pickerLoading}
              className="w-full py-3 px-5 text-[11px] font-medium uppercase tracking-[0.18em] rounded-none text-[#faf8f4] bg-[#73223a] hover:bg-[#651d33] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pickerLoading ? 'Buscando dirección…' : 'Confirmar ubicación'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
