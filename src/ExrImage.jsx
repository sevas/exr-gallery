import { useEffect, useRef, useState } from 'react'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

function ExrImage({ src, alt }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadTime, setLoadTime] = useState(null)
  const [resolution, setResolution] = useState(null)

  useEffect(() => {
    const loadExr = async () => {
      const startTime = performance.now()
      setLoading(true)
      setError(null)
      setLoadTime(null)
      setResolution(null)

      try {
        const loader = new EXRLoader()
        
        loader.load(
          src,
          (texture) => {
            const canvas = canvasRef.current
            if (!canvas) return

            const width = texture.image.width
            const height = texture.image.height
            
            canvas.width = width
            canvas.height = height
            
            const ctx = canvas.getContext('2d')
            const imageData = ctx.createImageData(width, height)
            
            const data = texture.image.data
            const exposure = 2.0 // Adjust brightness
            
            // Convert Float32Array to Uint8ClampedArray with tone mapping
            for (let i = 0; i < width * height; i++) {
              const idx = i * 4
              const r = data[idx] * exposure * 255
              const g = data[idx + 1] * exposure * 255
              const b = data[idx + 2] * exposure * 255
              
              imageData.data[idx] = Math.min(255, Math.max(0, r))
              imageData.data[idx + 1] = Math.min(255, Math.max(0, g))
              imageData.data[idx + 2] = Math.min(255, Math.max(0, b))
              imageData.data[idx + 3] = 255 // Alpha
            }
            
            ctx.putImageData(imageData, 0, 0)
            
            const endTime = performance.now()
            const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2)
            setLoadTime(timeInSeconds)
            setResolution(`${width} × ${height}`)
            setLoading(false)
          },
          undefined,
          (err) => {
            console.error('Error loading EXR:', err)
            setError(err.message || 'Failed to load EXR')
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('Error loading EXR:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    loadExr()
  }, [src])

  return (
    <div style={{ position: 'relative', minHeight: '400px' }}>
      {loading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          color: 'white',
          fontSize: '1.2rem'
        }}>
          Loading EXR...
        </div>
      )}
      {error && (
        <div style={{ 
          color: 'red', 
          padding: '20px',
          textAlign: 'center'
        }}>
          Error: {error}
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        alt={alt}
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          display: loading ? 'none' : 'block'
        }}
      />
      {(loadTime || resolution) && (
        <div style={{ 
          marginTop: '10px',
          color: '#888',
          fontSize: '0.9rem',
          textAlign: 'center',
          display: 'flex',
          gap: '20px',
          justifyContent: 'center'
        }}>
          {resolution && <span>Resolution: {resolution}</span>}
          {loadTime && <span>Load time: {loadTime}s</span>}
        </div>
      )}
    </div>
  )
}

export default ExrImage
