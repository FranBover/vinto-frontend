import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface NuevoPedidoPayload {
  pedidoId: number
  codigoSeguimiento: string
  nombreCliente: string
  total: number
  fechaCreacion: string
}

interface Props {
  pedido: NuevoPedidoPayload
  onClose: () => void
}

export default function NuevoPedidoToast({ pedido, onClose }: Props) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(onClose, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        backgroundColor: '#ffffff',
        borderLeft: '4px solid #2d5a27',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        padding: '16px 20px',
        minWidth: '280px',
        maxWidth: '360px',
        color: '#1a1a1a',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2d5a27', marginBottom: '4px' }}>
            Nuevo pedido
          </p>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            {pedido.nombreCliente} — ${pedido.total.toLocaleString('es-AR')}
          </p>
          <button
            onClick={() => {
              navigate(`/admin/pedidos/${pedido.pedidoId}`)
              onClose()
            }}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#2d5a27',
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
