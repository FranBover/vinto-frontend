interface Props {
  status: string | null | undefined
  statusDetail: string | null | undefined
  paymentId: string | null | undefined
  fechaPago: string | null | undefined
}

type BadgeColor = {
  bg: string
  text: string
  border: string
  label: string
}

function getBadgeConfig(status: string | null | undefined): BadgeColor | null {
  if (!status) return null

  if (status === 'approved' || status === 'authorized') {
    return {
      bg: '#eaf4e8',
      text: '#2d5a27',
      border: '#2d5a27',
      label: 'Pagado por Mercado Pago',
    }
  }

  if (status === 'pending' || status === 'in_process' || status === 'in_mediation') {
    return {
      bg: '#fff8e1',
      text: '#7d5e00',
      border: '#7d5e00',
      label: 'Pago pendiente',
    }
  }

  if (
    status === 'rejected' ||
    status === 'cancelled' ||
    status === 'refunded' ||
    status === 'charged_back'
  ) {
    return {
      bg: '#fdecec',
      text: '#a92020',
      border: '#a92020',
      label: 'Pago rechazado',
    }
  }

  return {
    bg: '#fff8e1',
    text: '#7d5e00',
    border: '#7d5e00',
    label: `Estado: ${status}`,
  }
}

const labelCls =
  'block text-[10px] font-bold text-[#aaa] uppercase tracking-widest mb-1'

export default function PagoMercadoPagoBadge({ status, statusDetail, paymentId, fechaPago }: Props) {
  const config = getBadgeConfig(status)

  if (!config) return null

  const fechaFormateada = fechaPago
    ? new Date(fechaPago).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div
      className="px-4 py-3 border-l-4 mt-3"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderLeftColor: config.border,
      }}
    >
      <p className="font-bold text-sm">{config.label}</p>

      <div className="mt-3 space-y-2 text-xs" style={{ color: config.text }}>
        {paymentId && (
          <div>
            <p className={labelCls} style={{ color: config.text, opacity: 0.6 }}>
              Payment ID
            </p>
            <p className="font-mono text-[11px] break-all">{paymentId}</p>
          </div>
        )}
        {statusDetail && (
          <div>
            <p className={labelCls} style={{ color: config.text, opacity: 0.6 }}>
              Detalle
            </p>
            <p className="text-[12px]">{statusDetail}</p>
          </div>
        )}
        {fechaFormateada && (
          <div>
            <p className={labelCls} style={{ color: config.text, opacity: 0.6 }}>
              Fecha de pago
            </p>
            <p className="text-[12px]">{fechaFormateada}</p>
          </div>
        )}
      </div>
    </div>
  )
}
