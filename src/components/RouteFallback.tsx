const SERIF = "'Fraunces', Georgia, serif"

export default function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f4]">
      <p
        className="text-sm text-[#6b6258]"
        style={{ fontFamily: SERIF, fontStyle: 'italic' }}
      >
        Cargando…
      </p>
    </div>
  )
}
