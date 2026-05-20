import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDiagnosticoMercadoPago } from '../../api/adminApi'
import type { MercadoPagoDiagnosticoResponse } from '../../types'

type AlertaTipo = 'no-conectado-con-pedidos' | 'token-expirado' | null

export default function MercadoPagoStatusBanner() {
  const [alerta, setAlerta] = useState<AlertaTipo>(null)
  const [pedidosPendientes, setPedidosPendientes] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    getDiagnosticoMercadoPago()
      .then((data: MercadoPagoDiagnosticoResponse) => {
        // Prioridad 1: token expirado (más urgente, MP conectado pero roto)
        if (data.conectado && data.tokenExpirado) {
          setAlerta('token-expirado')
          return
        }
        // Prioridad 2: no conectado con pedidos pendientes esperando pago
        if (!data.conectado && data.pedidosPendientesConMP > 0) {
          setAlerta('no-conectado-con-pedidos')
          setPedidosPendientes(data.pedidosPendientesConMP)
          return
        }
        // Todo OK
        setAlerta(null)
      })
      .catch(() => {
        // Si el diagnóstico falla, no mostramos banner
        setAlerta(null)
      })
  }, [])

  if (dismissed || alerta === null) return null

  const mensajes: Record<NonNullable<AlertaTipo>, { titulo: string; detalle: string }> = {
    'token-expirado': {
      titulo: 'El token de Mercado Pago expiró',
      detalle: 'Tus clientes no pueden completar pagos por Mercado Pago. Reconectalo desde Mi local.',
    },
    'no-conectado-con-pedidos': {
      titulo: 'Mercado Pago no está conectado',
      detalle: `Tenés ${pedidosPendientes} pedido${pedidosPendientes === 1 ? '' : 's'} con MP esperando pago. Conectá Mercado Pago para resolverlos.`,
    },
  }

  const m = mensajes[alerta]

  return (
    <div
      className="border-l-4 px-6 py-3 flex items-start gap-4"
      style={{
        backgroundColor: '#fdecec',
        color: '#a92020',
        borderLeftColor: '#a92020',
      }}
    >
      <div className="flex-1">
        <p className="font-bold text-sm">{m.titulo}</p>
        <p className="text-xs mt-0.5 leading-relaxed">{m.detalle}</p>
        <Link
          to="/admin/mi-local"
          className="text-xs font-bold underline mt-2 inline-block"
          style={{ color: '#a92020' }}
        >
          Ir a Mi local →
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          color: '#a92020',
          padding: 0,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  )
}
