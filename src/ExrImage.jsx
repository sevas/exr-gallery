import { useEffect, useRef, useState } from 'react'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

function ExrImage({ src, alt }) {
  const canvasRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadTime, setLoadTime] = useState(null)
  const [resolution, setResolution] = useState(null)
  const [exposure, setExposure] = useState(1.0)
  const [textureData, setTextureData] = useState(null)

  // Load EXR file
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
            setTextureData(texture)
            setResolution(`${texture.image.width} × ${texture.image.height}`)
            
            const endTime = performance.now()
            const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2)
            setLoadTime(timeInSeconds)
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

  // Render with current exposure
  useEffect(() => {
    if (!textureData || !canvasRef.current) return

    const canvas = canvasRef.current
    const width = textureData.image.width
    const height = textureData.image.height
    
    // Only set dimensions if they've changed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }
    
    const ctx = canvas.getContext('2d')
    const imageData = ctx.createImageData(width, height)
    
    const data = textureData.image.data
    
    // Find max value for normalization
    let maxVal = 0
    for (let i = 0; i < width * height * 4; i++) {
      if (data[i] > maxVal) maxVal = data[i]
    }
    
    // Convert Float32Array to Uint8ClampedArray with tone mapping
    // Normalize by max value, then apply exposure
    const normalizationFactor = maxVal > 1 ? maxVal : 1
    
    for (let i = 0; i < width * height; i++) {
      const idx = i * 4
      // Normalize to 0-1 range, apply exposure, then scale to 0-255
      const r = (data[idx] / normalizationFactor) * exposure * 255
      const g = (data[idx + 1] / normalizationFactor) * exposure * 255
      const b = (data[idx + 2] / normalizationFactor) * exposure * 255
      
      imageData.data[idx] = Math.min(255, Math.max(0, r))
      imageData.data[idx + 1] = Math.min(255, Math.max(0, g))
      imageData.data[idx + 2] = Math.min(255, Math.max(0, b))
      imageData.data[idx + 3] = 255 // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0)
  }, [textureData, exposure])

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
      {(loadTime || resolution || textureData) && (
        <div style={{ 
          marginTop: '10px',
          color: '#888',
          fontSize: '0.9rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
            {resolution && <span>Resolution: {resolution}</span>}
            {loadTime && <span>Load time: {loadTime}s</span>}
          </div>
          {textureData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label htmlFor="exposure-slider" style={{ fontWeight: '500' }}>
                Exposure:
              </label>
              <input
                id="exposure-slider"
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={exposure}
                onChange={(e) => setExposure(parseFloat(e.target.value))}
                style={{ width: '200px' }}
              />
              <span style={{ minWidth: '40px' }}>{exposure.toFixed(1)}</span>
              <button
                onClick={() => setExposure(1.0)}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  backgroundColor: '#646cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExrImage
