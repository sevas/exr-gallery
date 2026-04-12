import { useState, useEffect, useRef, useCallback } from 'react'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

// Double range slider component
function RangeSlider({ min, max, valueMin, valueMax, onChange, step = 0.01 }) {
  const trackRef = useRef(null)
  const [dragging, setDragging] = useState(null) // 'min', 'max', or null

  const range = max - min || 1
  const minPercent = ((valueMin - min) / range) * 100
  const maxPercent = ((valueMax - min) / range) * 100

  const handleMouseDown = (handle) => (e) => {
    e.preventDefault()
    setDragging(handle)
  }

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !trackRef.current) return
    
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const value = min + (percent / 100) * range

    if (dragging === 'min') {
      onChange(Math.min(value, valueMax - step), valueMax)
    } else {
      onChange(valueMin, Math.max(value, valueMin + step))
    }
  }, [dragging, min, range, valueMin, valueMax, onChange, step])

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  return (
    <div className="range-slider" ref={trackRef}>
      <div className="range-slider-track" />
      <div 
        className="range-slider-range"
        style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
      />
      <div
        className="range-slider-handle"
        style={{ left: `${minPercent}%` }}
        onMouseDown={handleMouseDown('min')}
      />
      <div
        className="range-slider-handle"
        style={{ left: `${maxPercent}%` }}
        onMouseDown={handleMouseDown('max')}
      />
    </div>
  )
}

// Colormap lookup tables (256 entries each)
const COLORMAPS = {
  gray: Array.from({ length: 256 }, (_, i) => [i, i, i]),
  viridis: generateViridis(),
  plasma: generatePlasma(),
}

function generateViridis() {
  // Simplified viridis using polynomial approximation
  const colors = []
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    // Polynomial approximation of viridis
    const r = Math.round(255 * Math.max(0, Math.min(1, 
      0.267004 + t * (0.004874 + t * (0.329415 + t * (-0.596662 + t * 0.596662))))))
    const g = Math.round(255 * Math.max(0, Math.min(1,
      0.004874 + t * (0.329415 + t * (0.456714 + t * (-0.504265 + t * 0.292092))))))
    const b = Math.round(255 * Math.max(0, Math.min(1,
      0.329415 + t * (0.456714 + t * (-0.596662 + t * (0.266102 + t * -0.023255))))))
    colors.push([
      Math.max(0, Math.min(255, Math.round(68 + t * (1 - t) * 200 * t))),
      Math.max(0, Math.min(255, Math.round(t * 255))),
      Math.max(0, Math.min(255, Math.round(84 + t * 100 - t * t * 150)))
    ])
  }
  // Better viridis approximation
  return Array.from({ length: 256 }, (_, i) => {
    const t = i / 255
    return [
      Math.round(255 * Math.max(0, Math.min(1, 0.267004 + t * (0.003991 + t * (0.850429 + t * (-1.469 + t * 0.667)))))),
      Math.round(255 * Math.max(0, Math.min(1, 0.004874 + t * (1.014994 + t * (-0.559 + t * (0.139 + t * 0.011)))))),
      Math.round(255 * Math.max(0, Math.min(1, 0.329415 + t * (0.527569 + t * (-1.440 + t * (1.340 + t * -0.456))))))
    ]
  })
}

function generatePlasma() {
  // Plasma colormap using polynomial approximation
  return Array.from({ length: 256 }, (_, i) => {
    const t = i / 255
    return [
      Math.round(255 * Math.max(0, Math.min(1, 0.050383 + t * (2.028 + t * (-1.313 + t * 0.091))))),
      Math.round(255 * Math.max(0, Math.min(1, 0.029803 + t * (0.258 + t * (0.656 + t * -0.163))))),
      Math.round(255 * Math.max(0, Math.min(1, 0.527975 + t * (0.735 + t * (-2.270 + t * 1.250)))))
    ]
  })
}

function Viewer() {
  const BASE_URL = import.meta.env.BASE_URL
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  // Image state
  const [imageData, setImageData] = useState(null)
  const [fileName, setFileName] = useState('')
  
  // View state
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // Level/colormap state
  const [minLevel, setMinLevel] = useState(0)
  const [maxLevel, setMaxLevel] = useState(1)
  const [colormap, setColormap] = useState('gray')
  
  // Pixel picker state
  const [mousePos, setMousePos] = useState(null)
  const [pixelValue, setPixelValue] = useState(null)

  // Sample images available
  const sampleImages = [
    { name: 'River Landscape', file: 'viewer/photo_river.jpg' },
    { name: 'River (Grayscale)', file: 'viewer/photo_river_gray.png' },
    { name: 'Autumn Leaves', file: 'viewer/photo_leaves.jpg' },
    { name: 'Leaves (Grayscale)', file: 'viewer/photo_leaves_gray.png' },
    { name: 'Coastal Scene', file: 'viewer/photo_coast.jpg' },
    { name: 'Coast (Grayscale)', file: 'viewer/photo_coast_gray.png' },
    { name: 'Gradient Gray (PNG)', file: 'viewer/gradient_gray.png' },
    { name: 'Gradient RGB (PNG)', file: 'viewer/gradient_rgb.png' },
    { name: 'Checkerboard (PNG)', file: 'viewer/checkerboard_gray.png' },
    { name: 'Test Pattern Gray (EXR)', file: 'viewer/testpattern_gray.exr' },
    { name: 'Test Pattern RGB (EXR)', file: 'viewer/testpattern_rgb.exr' },
  ]

  // Load PNG/JPG image
  const loadStandardImage = useCallback(async (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        
        // Determine if grayscale
        let isGray = true
        for (let i = 0; i < imgData.data.length; i += 4) {
          if (imgData.data[i] !== imgData.data[i + 1] || imgData.data[i + 1] !== imgData.data[i + 2]) {
            isGray = false
            break
          }
        }

        resolve({
          width: canvas.width,
          height: canvas.height,
          channels: isGray ? 1 : 3,
          dtype: 'uint8',
          data: imgData.data,
          stats: calculateStats(imgData.data, isGray ? 1 : 3, 'uint8')
        })
      }
      img.onerror = reject
      img.src = url
    })
  }, [])

  // Load EXR image
  const loadExrImage = useCallback(async (url) => {
    return new Promise((resolve, reject) => {
      const loader = new EXRLoader()
      loader.load(url, (texture) => {
        const data = texture.image.data
        const width = texture.image.width
        const height = texture.image.height
        
        // EXR typically has 4 channels (RGBA)
        // Check if it's grayscale
        let isGray = true
        for (let i = 0; i < data.length; i += 4) {
          if (Math.abs(data[i] - data[i + 1]) > 0.001 || Math.abs(data[i + 1] - data[i + 2]) > 0.001) {
            isGray = false
            break
          }
        }

        resolve({
          width,
          height,
          channels: isGray ? 1 : 3,
          dtype: 'float32',
          data: data,
          stats: calculateStats(data, isGray ? 1 : 3, 'float32')
        })
      }, undefined, reject)
    })
  }, [])

  // Calculate image statistics
  const calculateStats = (data, channels, dtype) => {
    let min = Infinity
    let max = -Infinity
    let sum = 0
    let count = 0
    
    const step = channels === 1 ? 4 : 4 // Always RGBA in buffer
    for (let i = 0; i < data.length; i += step) {
      for (let c = 0; c < Math.min(channels, 3); c++) {
        const val = data[i + c]
        if (isFinite(val)) {
          min = Math.min(min, val)
          max = Math.max(max, val)
          sum += val
          count++
        }
      }
    }
    
    return { min, max, mean: sum / count }
  }

  // Load image from URL or file
  const loadImage = useCallback(async (source, name) => {
    try {
      const isExr = name.toLowerCase().endsWith('.exr')
      const data = isExr ? await loadExrImage(source) : await loadStandardImage(source)
      
      setImageData(data)
      setFileName(name)
      setMinLevel(data.stats.min)
      setMaxLevel(data.stats.max)
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } catch (err) {
      console.error('Failed to load image:', err)
    }
  }, [loadExrImage, loadStandardImage])

  // Handle sample image selection
  const handleSampleSelect = (e) => {
    const file = e.target.value
    if (file) {
      loadImage(`${BASE_URL}${file}`, file.split('/').pop())
    }
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const url = URL.createObjectURL(file)
      loadImage(url, file.name)
    }
  }

  // Render image to canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { width, height, channels, dtype, data } = imageData

    // Set canvas size to viewport
    const container = canvas.parentElement
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // Apply pan and zoom
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y)
    ctx.scale(zoom, zoom)
    ctx.translate(-width / 2, -height / 2)

    // Create image data for rendering
    const outputData = ctx.createImageData(width, height)
    const range = maxLevel - minLevel || 1

    const lut = COLORMAPS[colormap] || COLORMAPS.gray

    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * 4
      const dstIdx = i * 4

      if (channels === 1) {
        // Grayscale - apply colormap
        const val = data[srcIdx]
        const normalized = Math.max(0, Math.min(1, (val - minLevel) / range))
        const lutIdx = Math.floor(normalized * 255)
        const color = lut[Math.max(0, Math.min(255, lutIdx))]
        outputData.data[dstIdx] = color[0]
        outputData.data[dstIdx + 1] = color[1]
        outputData.data[dstIdx + 2] = color[2]
        outputData.data[dstIdx + 3] = 255
      } else {
        // RGB - apply level mapping per channel
        for (let c = 0; c < 3; c++) {
          const val = data[srcIdx + c]
          const normalized = Math.max(0, Math.min(1, (val - minLevel) / range))
          outputData.data[dstIdx + c] = Math.round(normalized * 255)
        }
        outputData.data[dstIdx + 3] = 255
      }
    }

    // Draw to temporary canvas, then to main canvas with transform
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = width
    tempCanvas.height = height
    tempCanvas.getContext('2d').putImageData(outputData, 0, 0)
    
    ctx.imageSmoothingEnabled = zoom < 4
    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()
  }, [imageData, zoom, pan, minLevel, maxLevel, colormap])

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    // Update pan if dragging
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    // Calculate pixel position under mouse
    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // Transform to image coordinates
    const imgX = Math.floor((canvasX - canvas.width / 2 - pan.x) / zoom + imageData.width / 2)
    const imgY = Math.floor((canvasY - canvas.height / 2 - pan.y) / zoom + imageData.height / 2)

    if (imgX >= 0 && imgX < imageData.width && imgY >= 0 && imgY < imageData.height) {
      setMousePos({ x: imgX, y: imgY })
      
      const idx = (imgY * imageData.width + imgX) * 4
      if (imageData.channels === 1) {
        setPixelValue({ value: imageData.data[idx] })
      } else {
        setPixelValue({
          r: imageData.data[idx],
          g: imageData.data[idx + 1],
          b: imageData.data[idx + 2]
        })
      }
    } else {
      setMousePos(null)
      setPixelValue(null)
    }
  }, [isDragging, dragStart, pan, zoom, imageData])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
    setMousePos(null)
    setPixelValue(null)
  }, [])

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e) => {
      e.preventDefault()
      const step = e.ctrlKey ? 1 : 0.1
      const delta = e.deltaY > 0 ? -step : step
      setZoom(prev => Math.min(Math.max(prev + delta, 0.1), 50))
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  // Reset view
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Reset levels to auto
  const resetLevels = () => {
    if (imageData) {
      setMinLevel(imageData.stats.min)
      setMaxLevel(imageData.stats.max)
    }
  }

  // Format pixel value for display
  const formatValue = (val) => {
    if (imageData?.dtype === 'float32') {
      return val.toFixed(4)
    }
    return Math.round(val)
  }

  return (
    <div className="viewer-container">
      <h1>Image Viewer</h1>

      {/* Controls */}
      <div className="viewer-controls">
        <div className="control-group">
          <label>Sample Images:</label>
          <select onChange={handleSampleSelect} defaultValue="">
            <option value="">-- Select --</option>
            {sampleImages.map(img => (
              <option key={img.file} value={img.file}>{img.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Or upload:</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.exr"
            onChange={handleFileUpload}
          />
        </div>

        {imageData && (
          <>
            <div className="control-group levels-group">
              <label>Levels:</label>
              <input
                type="number"
                step={imageData.dtype === 'float32' ? 0.01 : 1}
                value={imageData.dtype === 'float32' ? minLevel.toFixed(2) : Math.round(minLevel)}
                onChange={(e) => setMinLevel(parseFloat(e.target.value))}
              />
              <RangeSlider
                min={imageData.stats.min}
                max={imageData.stats.max}
                valueMin={minLevel}
                valueMax={maxLevel}
                step={imageData.dtype === 'float32' ? 0.01 : 1}
                onChange={(newMin, newMax) => {
                  setMinLevel(newMin)
                  setMaxLevel(newMax)
                }}
              />
              <input
                type="number"
                step={imageData.dtype === 'float32' ? 0.01 : 1}
                value={imageData.dtype === 'float32' ? maxLevel.toFixed(2) : Math.round(maxLevel)}
                onChange={(e) => setMaxLevel(parseFloat(e.target.value))}
              />
              <button onClick={resetLevels}>Auto</button>
            </div>

            {imageData.channels === 1 && (
              <div className="control-group">
                <label>Colormap:</label>
                <select value={colormap} onChange={(e) => setColormap(e.target.value)}>
                  <option value="gray">Grayscale</option>
                  <option value="viridis">Viridis</option>
                  <option value="plasma">Plasma</option>
                </select>
              </div>
            )}

            <div className="control-group">
              <label>Zoom: {Math.round(zoom * 100)}%</label>
              <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.1))}>−</button>
              <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 50))}>+</button>
              <button onClick={resetView}>Reset View</button>
            </div>
          </>
        )}
      </div>

      {/* Canvas viewport */}
      <div className="viewer-viewport">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />
        
        {/* Pixel picker overlay */}
        {mousePos && pixelValue && (
          <div className="pixel-info">
            <span>({mousePos.x}, {mousePos.y})</span>
            {pixelValue.value !== undefined ? (
              <span>Value: {formatValue(pixelValue.value)}</span>
            ) : (
              <span>R:{formatValue(pixelValue.r)} G:{formatValue(pixelValue.g)} B:{formatValue(pixelValue.b)}</span>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      {imageData && (
        <div className="viewer-statusbar">
          <span>{fileName}</span>
          <span>{imageData.width} × {imageData.height}</span>
          <span>{imageData.channels === 1 ? 'Grayscale' : 'RGB'}</span>
          <span>{imageData.dtype}</span>
          <span>Range: [{formatValue(imageData.stats.min)} - {formatValue(imageData.stats.max)}]</span>
        </div>
      )}
    </div>
  )
}

export default Viewer
