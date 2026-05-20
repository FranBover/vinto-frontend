import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PagoConfirmadoPayload } from '../../store/notificationsStore'

interface Props {
  pago: PagoConfirmadoPayload
  onClose: () => void
}

export default function PagoConfirmadoToast({ pago, onClose }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderLeft: '4px solid #1e6ec7',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '16px 20px',
        minWidth: '280px',
        maxWidth: '360px',
        color: '#1a1a1a',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1e6ec7', marginBottom: '4px' }}>
            Pago confirmado
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {pago.nombreCliente} — ${pago.monto.toLocaleString('es-AR')}
          </p>
          <button
            onClick={() => {
              navigate(`/admin/pedidos/${pago.pedidoId}`)
              onClose()
            }}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#1e6ec7',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Ver pedido
          </button>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            color: '#aaa',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}
