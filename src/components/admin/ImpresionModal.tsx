import type { ComandaResponseDTO, TicketResponseDTO } from '../../api/adminApi'

type Props =
  | { tipo: 'comanda'; datos: ComandaResponseDTO; onClose: () => void }
  | { tipo: 'ticket';  datos: TicketResponseDTO;  onClose: () => void }

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

const SEP = '─'.repeat(32)

function ComandaContent({ d }: { d: ComandaResponseDTO }) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
        COMANDA #{d.codigoSeguimiento}
      </p>
      <p>{fmt(d.fecha)}</p>
      <p>{d.formaEntrega === 'Local' ? 'Retiro en local' : 'Delivery'}</p>
      <p style={{ marginTop: 4 }}><strong>{d.nombreCliente}</strong></p>
      {d.direccionCliente && <p>{d.direccionCliente}</p>}
      {d.referenciaDireccion && <p style={{ fontSize: 12, color: '#555' }}>Ref: {d.referenciaDireccion}</p>}
      <p style={{ margin: '10px 0', letterSpacing: 1 }}>{SEP}</p>
      {d.items.map((item, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <p style={{ fontWeight: 600 }}>{item.cantidad}x {item.nombreProducto}</p>
          {item.varianteDescripcion && (
            <p style={{ paddingLeft: 12, fontSize: 12 }}>{item.varianteDescripcion}</p>
          )}
          {item.extras.map((e, j) => (
            <p key={j} style={{ paddingLeft: 12 }}>+ {e}</p>
          ))}
        </div>
      ))}
    </div>
  )
}

function TicketContent({ d }: { d: TicketResponseDTO }) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>
        TICKET #{d.codigoSeguimiento}
      </p>
      <p style={{ fontWeight: 600 }}>{d.nombreLocal}</p>
      <p>{d.telefono}</p>
      <p style={{ marginTop: 4 }}>{fmt(d.fecha)}</p>
      <p style={{ margin: '10px 0', letterSpacing: 1 }}>{SEP}</p>
      <p><strong>{d.nombreCliente}</strong> — {d.telefonoCliente}</p>
      <p>{d.formaEntrega === 'Local' ? 'Retiro en local' : 'Delivery'}</p>
      {d.direccionCliente && <p>{d.direccionCliente}</p>}
      {d.referenciaDireccion && <p style={{ fontSize: 12, color: '#555' }}>Ref: {d.referenciaDireccion}</p>}
      <p style={{ marginTop: 4 }}>Pago: {d.formaPago}</p>
      <p style={{ margin: '10px 0', letterSpacing: 1 }}>{SEP}</p>
      {d.items.map((item, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600 }}>{item.cantidad}x {item.nombreProducto}</span>
            <span>{money(item.subtotal)}</span>
          </div>
          {item.varianteDescripcion && (
            <p style={{ paddingLeft: 12, fontSize: 12, margin: 0 }}>{item.varianteDescripcion}</p>
          )}
          {item.extras.map((e, j) => (
            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, fontSize: 12 }}>
              <span>+ {e.nombre}</span>
              {e.precioAdicional > 0 && <span>{money(e.precioAdicional)}</span>}
            </div>
          ))}
        </div>
      ))}
      <p style={{ margin: '10px 0', letterSpacing: 1 }}>{SEP}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal</span><span>{money(d.subtotal)}</span>
      </div>
      {d.costoEnvio > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Envío</span><span>{money(d.costoEnvio)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
        <span>TOTAL</span><span>{money(d.total)}</span>
      </div>
      {d.montoPagoEfectivo != null && (
        <p style={{ marginTop: 8 }}>
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
    const win = window.open('', '_blank', 'width=500,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: monospace; font-size: 13px; line-height: 1.6; color: #1a1a1a; padding: 16px; margin: 0; }
</style>
</head>
<body>${content.innerHTML}</body>
</html>`)
    win.document.close()
    win.focus()
    win.print()
    win.close()
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

        {/* Print content */}
        <div
          id="vinto-print-content"
          style={{
            padding: '20px 24px',
            fontFamily: 'monospace',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#1a1a1a',
          }}
        >
          {tipo === 'comanda'
            ? <ComandaContent d={datos as ComandaResponseDTO} />
            : <TicketContent  d={datos as TicketResponseDTO}  />
          }
        </div>
      </div>
    </>
  )
}
