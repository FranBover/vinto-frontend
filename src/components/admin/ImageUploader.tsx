import { useRef, useState } from 'react'
import { BASE_URL } from '../../config'
import { uploadImagen, deleteImagen } from '../../api/adminApi'
import type { ImagenResponse } from '../../api/adminApi'

interface PendingItem {
  file: File
  previewUrl: string
}

interface ImageUploaderProps {
  imagenes: ImagenResponse[]
  tipo: string
  entidadId?: number
  onImagenesChange: (imagenes: ImagenResponse[]) => void
  /** Called when pending (not-yet-uploaded) files change — used for new products */
  onPendingFilesChange?: (files: File[]) => void
  maxImagenes?: number
  /** When true, files are queued locally instead of uploaded immediately (for new products without an id yet) */
  deferred?: boolean
}

export default function ImageUploader({
  imagenes,
  tipo,
  entidadId,
  onImagenesChange,
  onPendingFilesChange,
  maxImagenes = 5,
  deferred = false,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])

  const totalCount = imagenes.length + pendingItems.length
  // For maxImagenes=1 always show the zone (tapping it replaces the existing image)
  const showUploadZone = maxImagenes === 1 || totalCount < maxImagenes

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be selected again later
    e.target.value = ''

    if (deferred) {
      // Queue locally — parent will upload after product creation
      const previewUrl = URL.createObjectURL(file)
      const newItems = [...pendingItems, { file, previewUrl }]
      setPendingItems(newItems)
      onPendingFilesChange?.(newItems.map(i => i.file))
      return
    }

    setUploading(true)
    try {
      // For maxImagenes=1 auto-delete the previous image before uploading
      if (maxImagenes === 1 && imagenes.length > 0) {
        await deleteImagen(imagenes[0].id)
        onImagenesChange([])
      }
      const orden = (maxImagenes === 1 ? 0 : imagenes.length) + 1
      const uploaded = await uploadImagen(file, tipo, entidadId, orden)
      onImagenesChange(maxImagenes === 1 ? [uploaded] : [...imagenes, uploaded])
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteUploaded = async (imagen: ImagenResponse) => {
    await deleteImagen(imagen.id)
    onImagenesChange(imagenes.filter(i => i.id !== imagen.id))
  }

  const handleRemovePending = (index: number) => {
    URL.revokeObjectURL(pendingItems[index].previewUrl)
    const newItems = pendingItems.filter((_, i) => i !== index)
    setPendingItems(newItems)
    onPendingFilesChange?.(newItems.map(i => i.file))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Uploaded thumbnails */}
      {imagenes.map(img => (
        <div key={img.id} className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
          <img
            src={BASE_URL + img.url}
            alt={img.nombreOriginal}
            className="w-full h-full object-cover border border-[#e8e8e8]"
          />
          <button
            type="button"
            onClick={() => handleDeleteUploaded(img)}
            className="absolute top-0 right-0 flex items-center justify-center bg-[#1a1a1a] text-white text-xs font-bold"
            style={{ width: 18, height: 18, lineHeight: 1 }}
            title="Eliminar"
          >
            ×
          </button>
        </div>
      ))}

      {/* Pending (local) thumbnails */}
      {pendingItems.map((item, i) => (
        <div key={i} className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="w-full h-full object-cover border border-[#d0d0d0]"
            style={{ opacity: 0.65 }}
          />
          <button
            type="button"
            onClick={() => handleRemovePending(i)}
            className="absolute top-0 right-0 flex items-center justify-center bg-[#1a1a1a] text-white text-xs font-bold"
            style={{ width: 18, height: 18, lineHeight: 1 }}
            title="Quitar"
          >
            ×
          </button>
        </div>
      ))}

      {/* Upload zone */}
      {showUploadZone && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex-shrink-0 flex items-center justify-center border border-dashed border-[#d0d0d0] text-[#aaa] hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-colors disabled:opacity-40"
          style={{ width: 80, height: 80 }}
        >
          {uploading ? (
            <span className="text-xs font-bold">...</span>
          ) : (
            <span className="text-2xl leading-none">+</span>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
