import { useRef, useState } from 'react'
import { ImageIcon, X, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { axios } from '@/lib/axios'
import { toast } from 'sonner'

interface FeaturedImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
}

export function FeaturedImageUpload({ value, onChange }: FeaturedImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await axios.post('/api/v1/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(res.data.url)
    } catch {
      toast.error('Error al subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (value) {
    const src = value.startsWith('/uploads/') ? `/api${value}` : value
    return (
      <div className='relative rounded-md overflow-hidden border'>
        <img src={src} alt='Imagen destacada' className='w-full object-cover max-h-48' />
        <Button
          type='button'
          variant='destructive'
          size='icon'
          className='absolute top-2 right-2 h-7 w-7'
          onClick={() => onChange(null)}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>
    )
  }

  return (
    <div
      className='border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 cursor-pointer hover:bg-muted/40 transition-colors'
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {uploading ? (
        <Upload className='h-8 w-8 text-muted-foreground animate-bounce' />
      ) : (
        <ImageIcon className='h-8 w-8 text-muted-foreground' />
      )}
      <p className='text-sm text-muted-foreground'>
        {uploading ? 'Subiendo...' : 'Haz clic o arrastra una imagen'}
      </p>
    </div>
  )
}
