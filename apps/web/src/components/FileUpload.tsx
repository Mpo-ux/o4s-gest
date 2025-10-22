import React, { useState, useRef, DragEvent } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedTypes: string[]
  maxSize?: number // em MB
  title?: string
  description?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes,
  maxSize = 10,
  title = 'Upload de Ficheiro',
  description = 'Arraste e largue o ficheiro ou clique para selecionar'
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): boolean => {
    setError(null)

    // Verificar tipo de ficheiro
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const isValidType = acceptedTypes.some(type => 
      type.includes('*') || 
      file.type === type || 
      (fileExtension && type.includes(fileExtension))
    )

    if (!isValidType) {
      setError(`Tipo de ficheiro não suportado. Aceite: ${acceptedTypes.join(', ')}`)
      return false
    }

    // Verificar tamanho
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxSize) {
      setError(`Ficheiro muito grande. Tamanho máximo: ${maxSize}MB`)
      return false
    }

    return true
  }

  const handleFile = async (file: File) => {
    if (validateFile(file)) {
      setIsUploading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 500)) // Simular upload
        onFileSelect(file)
      } catch (error) {
        setError('Erro ao processar ficheiro')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 hover:shadow-lg
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
          className="hidden"
          aria-label="Upload de ficheiro"
          title="Selecionar ficheiro para upload"
        />

        {/* Upload Icon */}
        <div className="mb-4">
          {isUploading ? (
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isDragOver 
                ? 'bg-blue-600 scale-110' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              <span className="text-3xl text-white">
                {isDragOver ? '📥' : '📁'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-800">
            {isUploading ? 'A processar...' : title}
          </h3>
          <p className="text-slate-600">
            {isUploading ? 'Por favor aguarde' : description}
          </p>
          
          {!isUploading && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-slate-500">
                Tipos suportados: {acceptedTypes.map(type => {
                  if (type.includes('csv')) return 'CSV'
                  if (type.includes('excel') || type.includes('sheet')) return 'Excel'
                  if (type.includes('pdf')) return 'PDF'
                  return type
                }).join(', ')}
              </p>
              <p className="text-xs text-slate-400">
                Tamanho máximo: {maxSize}MB
              </p>
            </div>
          )}
        </div>

        {/* Upload Button */}
        {!isUploading && (
          <div className="mt-6">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/25">
              Selecionar Ficheiro
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2 text-red-700">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}