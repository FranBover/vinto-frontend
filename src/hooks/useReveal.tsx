import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Retraso de la animación en ms */
  delay?: number
  className?: string
}

/**
 * Envuelve contenido y lo anima al entrar en viewport:
 * fade (opacity 0→1) + subida sutil (translateY 18px→0).
 * Se dispara una sola vez y desconecta el observer.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
