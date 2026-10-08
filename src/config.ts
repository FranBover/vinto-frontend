export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5202/api'
export const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5202'

const ABSOLUTE_URL = /^https?:\/\//i

// Resuelve la URL de una imagen: las absolutas (Blob Storage) van tal cual; las
// relativas se anteponen con BASE_URL.
export const resolveImageUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  if (ABSOLUTE_URL.test(url)) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export const WHATSAPP_URL = 'https://wa.me/5493512308157?text=Hola%20Francisco%2C%20vi%20Vinto%20y%20me%20interesa%20tener%20una%20tienda%20online%20para%20mi%20negocio.%20%C2%BFPodemos%20hablar%3F'
export const DEMO_URL = '/ejemplo'