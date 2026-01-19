import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageLightboxProps {
  images: { url: string; alt?: string }[]
  initialIndex?: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const currentImage = images[currentIndex]
  const hasMultiple = images.length > 1

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasMultiple) {
            setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
            resetTransforms()
          }
          break
        case 'ArrowRight':
          if (hasMultiple) {
            setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
            resetTransforms()
          }
          break
        case '+':
        case '=':
          setScale((prev) => Math.min(prev + 0.25, 3))
          break
        case '-':
          setScale((prev) => Math.max(prev - 0.25, 0.5))
          break
        case 'r':
          setRotation((prev) => (prev + 90) % 360)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasMultiple, images.length, onClose])

  // Prevent body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const resetTransforms = useCallback(() => {
    setScale(1)
    setRotation(0)
  }, [])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    resetTransforms()
  }, [images.length, resetTransforms])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    resetTransforms()
  }, [images.length, resetTransforms])

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentImage.alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Download failed silently - user can retry
    }
  }, [currentImage])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors z-10"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Controls bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 rounded-lg p-1 z-10">
        <button
          onClick={() => setScale((prev) => Math.max(prev - 0.25, 0.5))}
          className="p-2 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="px-2 text-sm text-white/70 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((prev) => Math.min(prev + 0.25, 3))}
          className="p-2 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={() => setRotation((prev) => (prev + 90) % 360)}
          className="p-2 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
          aria-label="Rotate"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={handleDownload}
          className="p-2 text-white/70 hover:text-white rounded hover:bg-white/10 transition-colors"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation arrows */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden"
        onClick={(e) => {
          // Close on backdrop click
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || 'Image'}
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>

      {/* Image counter and thumbnails */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-10">
          {/* Thumbnails */}
          <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  resetTransforms()
                }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Counter */}
          <span className="text-sm text-white/70">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="absolute bottom-4 right-4 text-xs text-white/40 hidden sm:block">
        <span className="mr-3">← → Navigate</span>
        <span className="mr-3">+ - Zoom</span>
        <span className="mr-3">R Rotate</span>
        <span>Esc Close</span>
      </div>
    </div>
  )
}

// Hook for managing lightbox state
export function useLightbox() {
  const [state, setState] = useState<{
    isOpen: boolean
    images: { url: string; alt?: string }[]
    initialIndex: number
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
  })

  const openLightbox = useCallback((images: { url: string; alt?: string }[], initialIndex = 0) => {
    setState({ isOpen: true, images, initialIndex })
  }, [])

  const closeLightbox = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  return {
    ...state,
    openLightbox,
    closeLightbox,
  }
}
