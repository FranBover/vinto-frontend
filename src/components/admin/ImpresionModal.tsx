import type { CSSProperties, ReactNode } from 'react'
import type { ComandaResponseDTO, TicketResponseDTO } from '../../api/adminApi'

type Props =
  | { tipo: 'comanda'; datos: ComandaResponseDTO; onClose: () => void }
  | { tipo: 'ticket';  datos: TicketResponseDTO;  onClose: () => void }

// ── Papel térmico ─────────────────────────────────────────────────────────────
// Ancho del rollo. Para un local con rollo de 58 mm alcanza con cambiar este valor (todavía no es
// configurable por local).
const ANCHO_PAPEL_MM = 80
// Zona no imprimible a cada lado: de un rollo de 80 mm se imprimen 72.
const MARGEN_LATERAL_MM = 4
const ANCHO_CONTENIDO_MM = ANCHO_PAPEL_MM - 2 * MARGEN_LATERAL_MM
// Papel en blanco al final, para que el corte no caiga sobre la última línea.
const MARGEN_CORTE_MM = 10
const MM_POR_PX = 25.4 / 96

// Tamaños en pt: se imprimen a escala real. Todo en negro puro: la térmica no imprime grises ni
// transparencias (o los imprime mal).
const PT = { base: 10, item: 11, titulo: 12, total: 14 }
const pt = (n: number) => `${n}pt`
const NEGRO = '#000'
const FUENTE: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: pt(PT.base),
  lineHeight: 1.35,
  color: NEGRO,
  // Nombres y direcciones largos parten la línea en vez de salirse del papel.
  overflowWrap: 'anywhere',
}

// El popup no tiene Tailwind ni nada de la app: acá está todo lo que necesita para verse igual que
// la vista previa del modal.
const CSS_IMPRESION = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { width: ${ANCHO_PAPEL_MM}mm; font-family: monospace; font-size: ${pt(PT.base)}; line-height: 1.35; }
  p { margin: 0; }
  #ticket { display: flow-root; width: ${ANCHO_CONTENIDO_MM}mm; margin: 0 auto; padding-top: 3mm; overflow-wrap: anywhere; }
  /* Pase lo que pase con los estilos de adentro, nada sale gris ni transparente. */
  #ticket, #ticket * { color: #000 !important; opacity: 1 !important; background: none !important; text-shadow: none !important; box-shadow: none !important; }
`

function escapar(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
}

/**
 * Abre el ticket en una ventana y lo imprime. El papel de un rollo mide lo que mide el ticket: se
 * mide el alto real del contenido (a 72 mm de ancho) y se lo pone en `@page`, con margin 0, que
 * además deja sin lugar al encabezado y al pie que el navegador agrega ("about:blank", la fecha).
 */
function imprimir(titulo: string, contenido: HTMLElement) {
  const win = window.open('', '_blank', 'width=500,height=700')
  if (!win) return
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${escapar(titulo)}</title>
<style>${CSS_IMPRESION}</style>
</head>
<body><div id="ticket">${contenido.innerHTML}</div></body>
</html>`)
  win.document.close()

  const ticket = win.document.getElementById('ticket')
  if (!ticket) {
    win.close()
    return
  }
  const altoMm = Math.ceil(ticket.getBoundingClientRect().height * MM_POR_PX) + MARGEN_CORTE_MM
  const pagina = win.document.createElement('style')
  pagina.textContent = `@page { size: ${ANCHO_PAPEL_MM}mm ${altoMm}mm; margin: 0 }`
  win.document.head.appendChild(pagina)

  win.focus()
  win.print()
  win.close()
}

function fmt(iso: string): string {
  if (!iso) return '—'
  let d = new Date(iso)
  // Fallback: handle dd/MM/yyyy HH:mm:ss (locale-formatted .NET dates)
  if (isNaN(d.getTime())) {
    const m = iso.match(/^(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}):(\d{2})/)
    if (m) d = new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`)
  }
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function money(n: number) {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2 })
}

// Separador: un borde y no una fila de caracteres, así ocupa siempre el ancho exacto del papel.
function Sep() {
  return <div style={{ borderTop: `2px dashed ${NEGRO}`, margin: '2mm 0' }} />
}

// Fila con texto a la izquierda y un importe a la derecha: el importe no se parte ni se achica, el
// texto cede y parte la línea.
function Fila({ izq, der, style }: { izq: ReactNode; der?: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2mm', ...style }}>
      <span style={{ minWidth: 0 }}>{izq}</span>
      <span style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{der}</span>
    </div>
  )
}

const SANGRIA = '3mm'
const NEGRITA: CSSProperties = { fontWeight: 700 }
const LINEA_ITEM: CSSProperties = { fontWeight: 700, fontSize: pt(PT.item) }

function ComandaContent({ d }: { d: ComandaResponseDTO }) {
  return (
    <div>
      <p style={{ ...NEGRITA, fontSize: pt(PT.titulo), marginBottom: '1mm' }}>
        COMANDA #{d.codigoSeguimiento}
      </p>
      <p>{fmt(d.fecha)}</p>
      <p style={NEGRITA}>{d.formaEntrega === 'Delivery' ? 'Delivery' : 'Retiro en local'}</p>
      <p style={{ ...NEGRITA, marginTop: '1mm' }}>{d.nombreCliente}</p>
      {d.direccionCliente && <p>{d.direccionCliente}</p>}
      {d.referenciaDireccion && <p>Ref: {d.referenciaDireccion}</p>}
      <Sep />
      {d.items.map((item, i) => (
        <div key={i} style={{ marginBottom: '2mm' }}>
          <p style={LINEA_ITEM}>{item.cantidad}x {item.nombreProducto}</p>
          {item.varianteDescripcion && (
            <p style={{ paddingLeft: SANGRIA }}>{item.varianteDescripcion}</p>
          )}
          {item.extras.map((e, j) => (
            <p key={j} style={{ paddingLeft: SANGRIA }}>+ {e}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function TicketContent({ d }: { d: TicketResponseDTO }) {
  return (
    <div>
      <p style={{ ...NEGRITA, fontSize: pt(PT.titulo), marginBottom: '1mm' }}>
        TICKET #{d.codigoSeguimiento}
      </p>
      <p style={{ ...NEGRITA, fontSize: pt(PT.item) }}>{d.nombreLocal}</p>
      <p>{d.telefono}</p>
      <p style={{ marginTop: '1mm' }}>{fmt(d.fecha)}</p>
      <Sep />
      <p><span style={NEGRITA}>{d.nombreCliente}</span> — {d.telefonoCliente}</p>
      <p style={NEGRITA}>{d.formaEntrega === 'Delivery' ? 'Delivery' : 'Retiro en local'}</p>
      {d.direccionCliente && <p>{d.direccionCliente}</p>}
      {d.referenciaDireccion && <p>Ref: {d.referenciaDireccion}</p>}
      <p style={{ marginTop: '1mm' }}>Pago: {d.formaPago}</p>
      <Sep />
      {d.items.map((item, i) => (
        <div key={i} style={{ marginBottom: '2mm' }}>
          <Fila
            style={LINEA_ITEM}
            izq={`${item.cantidad}x ${item.nombreProducto}`}
            der={money(item.subtotal)}
          />
          {item.varianteDescripcion && (
            <p style={{ paddingLeft: SANGRIA }}>{item.varianteDescripcion}</p>
          )}
          {item.extras.map((e, j) => (
            <Fila
              key={j}
              style={{ paddingLeft: SANGRIA }}
              izq={`+ ${e.nombre}`}
              der={e.precioAdicional > 0 ? money(e.precioAdicional) : null}
            />
          ))}
        </div>
      ))}
      <Sep />
      {((d.montoDescuentoProductos ?? 0) > 0 || (d.montoDescuentoCupon ?? 0) > 0) && (
        <>
          <Fila izq="Subtotal sin descuentos" der={money(d.subtotalSinDescuentos ?? 0)} />
          {(d.montoDescuentoProductos ?? 0) > 0 && (
            <Fila izq="Desc. productos" der={`-${money(d.montoDescuentoProductos ?? 0)}`} />
          )}
          {(d.montoDescuentoCupon ?? 0) > 0 && (
            <Fila izq={`Cupón ${d.codigoCupon}`} der={`-${money(d.montoDescuentoCupon ?? 0)}`} />
          )}
        </>
      )}
      <Fila izq="Subtotal" der={money(d.subtotal)} />
      {d.costoEnvio > 0 && <Fila izq="Envío" der={money(d.costoEnvio)} />}
      <Fila
        style={{ ...NEGRITA, fontSize: pt(PT.total), marginTop: '1mm' }}
        izq="TOTAL"
        der={money(d.total)}
      />
      {d.montoPagoEfectivo != null && (
        <p style={{ ...NEGRITA, marginTop: '2mm' }}>
          Paga con {money(d.montoPagoEfectivo)}
          {d.vuelto != null && d.vuelto > 0 && ` — Vuelto: ${money(d.vuelto)}`}
        </p>
      )}
    </div>
  )
}

export default function ImpresionModal(props: Props) {
  const { tipo, datos, onClose } = props

  const handlePrint = () => {
    const content = document.getElementById('vinto-print-content')
    if (!content) return
    imprimir(`${tipo === 'comanda' ? 'Comanda' : 'Ticket'} #${datos.codigoSeguimiento}`, content)
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 10000,
        }}
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001,
          background: '#fff',
          width: 420,
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e8e8e8',
            background: '#fafaf9',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa' }}>
            {tipo === 'comanda' ? 'Comanda' : 'Ticket'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600,
                background: '#1a1a1a', color: '#fff',
                border: 'none', borderRadius: 0, cursor: 'pointer',
              }}
            >
              Imprimir
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '5px 14px', fontSize: 12, fontWeight: 600,
                background: '#fff', color: '#1a1a1a',
                border: '1px solid #1a1a1a', borderRadius: 0, cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Print content: mismo ancho y tipografía que el papel, así lo que se ve es lo que sale */}
        <div style={{ padding: '20px 0' }}>
          <div
            id="vinto-print-content"
            style={{ ...FUENTE, width: `${ANCHO_CONTENIDO_MM}mm`, margin: '0 auto' }}
          >
            {tipo === 'comanda'
              ? <ComandaContent d={datos as ComandaResponseDTO} />
              : <TicketContent  d={datos as TicketResponseDTO}  />
            }
          </div>
        </div>
      </div>
    </>
  )
}
