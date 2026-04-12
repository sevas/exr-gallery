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

// Histogram display component
function HistogramDisplay({ histogram, onClose }) {
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !histogram) return
    
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const leftMargin = 40
    const bottomMargin = 20
    
    // Clear
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)
    
    // Find max count for normalization
    let maxCount = 0
    for (const v of histogram.r) maxCount = Math.max(maxCount, v)
    if (histogram.g) {
      for (const v of histogram.g) maxCount = Math.max(maxCount, v)
      for (const v of histogram.b) maxCount = Math.max(maxCount, v)
    }
    
    if (maxCount === 0) return
    
    const plotWidth = width - leftMargin
    const plotHeight = height - bottomMargin
    const barWidth = plotWidth / 256
    
    // Draw histogram bars
    const drawChannel = (data, color) => {
      ctx.fillStyle = color
      for (let i = 0; i < 256; i++) {
        const barHeight = (data[i] / maxCount) * plotHeight
        if (barHeight > 0) {
          ctx.fillRect(
            leftMargin + Math.floor(i * barWidth), 
            plotHeight - barHeight, 
            Math.max(1, Math.floor(barWidth)), 
            barHeight
          )
        }
      }
    }
    
    if (histogram.channels === 1) {
      drawChannel(histogram.r, '#ffffff')
    } else {
      // RGB - draw with transparency
      ctx.globalAlpha = 0.6
      drawChannel(histogram.r, '#ff4444')
      drawChannel(histogram.g, '#44ff44')
      drawChannel(histogram.b, '#4444ff')
      ctx.globalAlpha = 1.0
    }
    
    // Draw axis labels
    ctx.fillStyle = '#888'
    ctx.font = '10px monospace'
    
    // X-axis labels (value range)
    ctx.textAlign = 'left'
    ctx.fillText(histogram.min.toFixed(2), leftMargin, height - 4)
    ctx.textAlign = 'right'
    ctx.fillText(histogram.max.toFixed(2), width - 2, height - 4)
    
    // Y-axis labels (count)
    ctx.textAlign = 'right'
    ctx.fillText(maxCount.toString(), leftMargin - 4, 12)
    ctx.fillText('0', leftMargin - 4, plotHeight)
  }, [histogram])
  
  if (!histogram) return null
  
  return (
    <div className="histogram-panel">
      <div className="histogram-header">
        <span>Histogram ({histogram.numPixels} pixels)</span>
        <button onClick={onClose}>×</button>
      </div>
      <canvas ref={canvasRef} width={512} height={140} />
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
  
  // Bayer channel filter (null = show all, 'R', 'G1', 'G2', 'B')
  const [bayerChannel, setBayerChannel] = useState(null)
  const [isBayerImage, setIsBayerImage] = useState(false)
  
  // Pixel picker state
  const [mousePos, setMousePos] = useState(null)
  const [pixelValue, setPixelValue] = useState(null)

  // Rectangle selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selection, setSelection] = useState(null) // {x1, y1, x2, y2} in image coords
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState(null)
  const [histogram, setHistogram] = useState(null)

  // Sample images available
  const sampleImages = [
    { name: 'River Landscape', file: 'viewer/photo_river.jpg' },
    { name: 'River (Grayscale)', file: 'viewer/photo_river_gray.png' },
    { name: 'River (Bayer RGGB)', file: 'viewer/photo_river_bayer.png' },
    { name: 'Autumn Leaves', file: 'viewer/photo_leaves.jpg' },
    { name: 'Leaves (Grayscale)', file: 'viewer/photo_leaves_gray.png' },
    { name: 'Leaves (Bayer RGGB)', file: 'viewer/photo_leaves_bayer.png' },
    { name: 'Coastal Scene', file: 'viewer/photo_coast.jpg' },
    { name: 'Coast (Grayscale)', file: 'viewer/photo_coast_gray.png' },
    { name: 'Coast (Bayer RGGB)', file: 'viewer/photo_coast_bayer.png' },
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
      
      // Detect Bayer images by filename
      const isBayer = name.toLowerCase().includes('bayer')
      setIsBayerImage(isBayer)
      setBayerChannel(null)
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
    const range = maxLevel - minLevel || 1
    const lut = COLORMAPS[colormap] || COLORMAPS.gray

    // For Bayer channel filter, create extracted subimage
    let outputWidth = width
    let outputHeight = height
    let outputData

    if (bayerChannel && channels === 1) {
      // Extract only selected channel pixels into a new smaller image
      outputWidth = Math.floor(width / 2)
      outputHeight = Math.floor(height / 2)
      outputData = ctx.createImageData(outputWidth, outputHeight)

      // Determine starting offset based on channel
      let startX = 0, startY = 0
      switch (bayerChannel) {
        case 'R': startX = 0; startY = 0; break   // even row, even col
        case 'G1': startX = 1; startY = 0; break  // even row, odd col
        case 'G2': startX = 0; startY = 1; break  // odd row, even col
        case 'B': startX = 1; startY = 1; break   // odd row, odd col
      }

      for (let oy = 0; oy < outputHeight; oy++) {
        for (let ox = 0; ox < outputWidth; ox++) {
          const srcX = ox * 2 + startX
          const srcY = oy * 2 + startY
          const srcIdx = (srcY * width + srcX) * 4
          const dstIdx = (oy * outputWidth + ox) * 4

          const val = data[srcIdx]
          const normalized = Math.max(0, Math.min(1, (val - minLevel) / range))
          const lutIdx = Math.floor(normalized * 255)
          const color = lut[Math.max(0, Math.min(255, lutIdx))]
          outputData.data[dstIdx] = color[0]
          outputData.data[dstIdx + 1] = color[1]
          outputData.data[dstIdx + 2] = color[2]
          outputData.data[dstIdx + 3] = 255
        }
      }
    } else {
      // Normal rendering (no Bayer filter or RGB image)
      outputData = ctx.createImageData(width, height)

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = y * width + x
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
      }
    }

    // Draw to temporary canvas, then to main canvas with transform
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = outputWidth
    tempCanvas.height = outputHeight
    tempCanvas.getContext('2d').putImageData(outputData, 0, 0)
    
    ctx.imageSmoothingEnabled = zoom < 4
    ctx.drawImage(tempCanvas, 0, 0, outputWidth, outputHeight)

    // Draw selection rectangle if exists
    if (selection) {
      const x1 = (selection.x1 - width / 2) * zoom + canvas.width / 2 + pan.x
      const y1 = (selection.y1 - height / 2) * zoom + canvas.height / 2 + pan.y
      const x2 = (selection.x2 - width / 2) * zoom + canvas.width / 2 + pan.x
      const y2 = (selection.y2 - height / 2) * zoom + canvas.height / 2 + pan.y
      
      ctx.restore()
      ctx.strokeStyle = '#00ff00'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)
      ctx.setLineDash([])
    } else {
      ctx.restore()
    }
  }, [imageData, zoom, pan, minLevel, maxLevel, colormap, selection, bayerChannel])

  // Helper to convert canvas coords to image coords
  const canvasToImageCoords = useCallback((canvasX, canvasY) => {
    if (!canvasRef.current || !imageData) return null
    const canvas = canvasRef.current
    const imgX = Math.floor((canvasX - canvas.width / 2 - pan.x) / zoom + imageData.width / 2)
    const imgY = Math.floor((canvasY - canvas.height / 2 - pan.y) / zoom + imageData.height / 2)
    return { x: imgX, y: imgY }
  }, [pan, zoom, imageData])

  // Mouse handlers for pan and selection
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top
    
    if (selectionMode && imageData) {
      // Start selection
      const imgCoords = canvasToImageCoords(canvasX, canvasY)
      if (imgCoords) {
        setIsSelecting(true)
        setSelectionStart(imgCoords)
        setSelection(null)
        setHistogram(null)
      }
    } else {
      // Start panning
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan, selectionMode, imageData, canvasToImageCoords])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas || !imageData) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // Update selection if selecting
    if (isSelecting && selectionStart) {
      const imgCoords = canvasToImageCoords(canvasX, canvasY)
      if (imgCoords) {
        setSelection({
          x1: Math.min(selectionStart.x, imgCoords.x),
          y1: Math.min(selectionStart.y, imgCoords.y),
          x2: Math.max(selectionStart.x, imgCoords.x),
          y2: Math.max(selectionStart.y, imgCoords.y)
        })
      }
      return
    }

    // Update pan if dragging
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    // Calculate pixel position under mouse
    const imgX = Math.floor((canvasX - canvas.width / 2 - pan.x) / zoom + imageData.width / 2)
    const imgY = Math.floor((canvasY - canvas.height / 2 - pan.y) / zoom + imageData.height / 2)

    if (imgX >= 0 && imgX < imageData.width && imgY >= 0 && imgY < imageData.height) {
      setMousePos({ x: imgX, y: imgY })
      
      // Check if pixel matches Bayer channel filter
      const isSelectedChannel = () => {
        if (!bayerChannel) return true
        const evenRow = imgY % 2 === 0
        const evenCol = imgX % 2 === 0
        switch (bayerChannel) {
          case 'R': return evenRow && evenCol
          case 'G1': return evenRow && !evenCol
          case 'G2': return !evenRow && evenCol
          case 'B': return !evenRow && !evenCol
          default: return true
        }
      }

      if (isSelectedChannel()) {
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
        setPixelValue(null)
      }
    } else {
      setMousePos(null)
      setPixelValue(null)
    }
  }, [isDragging, isSelecting, selectionStart, dragStart, pan, zoom, imageData, canvasToImageCoords, bayerChannel])

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selection) {
      // Compute histogram for selected area
      computeHistogram(selection)
    }
    setIsDragging(false)
    setIsSelecting(false)
  }, [isSelecting, selection])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
    setIsSelecting(false)
    setMousePos(null)
    setPixelValue(null)
  }, [])

  // Compute histogram for selected area
  const computeHistogram = useCallback((sel) => {
    if (!imageData || !sel) return

    // Clamp selection to image bounds
    const x1 = Math.max(0, Math.min(sel.x1, imageData.width - 1))
    const y1 = Math.max(0, Math.min(sel.y1, imageData.height - 1))
    const x2 = Math.max(0, Math.min(sel.x2, imageData.width - 1))
    const y2 = Math.max(0, Math.min(sel.y2, imageData.height - 1))

    const numBins = 256
    const channels = imageData.channels
    
    // Initialize histogram bins
    const histR = new Array(numBins).fill(0)
    const histG = channels > 1 ? new Array(numBins).fill(0) : null
    const histB = channels > 1 ? new Array(numBins).fill(0) : null

    // Helper to check if pixel matches Bayer channel filter
    const shouldIncludePixel = (x, y) => {
      if (!bayerChannel) return true
      const evenRow = y % 2 === 0
      const evenCol = x % 2 === 0
      switch (bayerChannel) {
        case 'R': return evenRow && evenCol
        case 'G1': return evenRow && !evenCol
        case 'G2': return !evenRow && evenCol
        case 'B': return !evenRow && !evenCol
        default: return true
      }
    }

    let minVal = Infinity, maxVal = -Infinity
    const values = []
    let pixelCount = 0

    // Collect values from selection (filtered by Bayer channel if active)
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (!shouldIncludePixel(x, y)) continue
        pixelCount++
        const idx = (y * imageData.width + x) * 4
        if (channels === 1) {
          values.push(imageData.data[idx])
        } else {
          values.push(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2])
        }
      }
    }

    // Find min/max for normalization
    for (const v of values) {
      if (v < minVal) minVal = v
      if (v > maxVal) maxVal = v
    }

    // Build histogram
    const range = maxVal - minVal || 1
    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        if (!shouldIncludePixel(x, y)) continue
        const idx = (y * imageData.width + x) * 4
        if (channels === 1) {
          const binIdx = Math.floor(((imageData.data[idx] - minVal) / range) * (numBins - 1))
          histR[Math.max(0, Math.min(numBins - 1, binIdx))]++
        } else {
          const binR = Math.floor(((imageData.data[idx] - minVal) / range) * (numBins - 1))
          const binG = Math.floor(((imageData.data[idx + 1] - minVal) / range) * (numBins - 1))
          const binB = Math.floor(((imageData.data[idx + 2] - minVal) / range) * (numBins - 1))
          histR[Math.max(0, Math.min(numBins - 1, binR))]++
          histG[Math.max(0, Math.min(numBins - 1, binG))]++
          histB[Math.max(0, Math.min(numBins - 1, binB))]++
        }
      }
    }

    setHistogram({
      r: histR,
      g: histG,
      b: histB,
      channels,
      min: minVal,
      max: maxVal,
      numPixels: pixelCount
    })
  }, [imageData, bayerChannel])

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

            {isBayerImage && imageData.channels === 1 && (
              <div className="control-group">
                <label>Bayer Channel:</label>
                <select value={bayerChannel || ''} onChange={(e) => setBayerChannel(e.target.value || null)}>
                  <option value="">All</option>
                  <option value="R">R (Red)</option>
                  <option value="G1">G1 (Green 1)</option>
                  <option value="G2">G2 (Green 2)</option>
                  <option value="B">B (Blue)</option>
                </select>
              </div>
            )}

            <div className="control-group">
              <label>Zoom: {Math.round(zoom * 100)}%</label>
              <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.1))}>−</button>
              <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 50))}>+</button>
              <button onClick={resetView}>Reset View</button>
            </div>

            <div className="control-group">
              <button 
                className={selectionMode ? 'active' : ''}
                onClick={() => {
                  setSelectionMode(!selectionMode)
                  if (selectionMode) {
                    setSelection(null)
                    setHistogram(null)
                  }
                }}
              >
                {selectionMode ? '📊 Select Area (ON)' : '📊 Select Area'}
              </button>
              {selection && (
                <button onClick={() => { setSelection(null); setHistogram(null); }}>
                  Clear Selection
                </button>
              )}
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
          style={{ cursor: selectionMode ? 'crosshair' : (isDragging ? 'grabbing' : 'grab') }}
        />
        
        {/* Pixel picker overlay */}
        {mousePos && pixelValue && !selectionMode && (
          <div className="pixel-info">
            <span>({mousePos.x}, {mousePos.y})</span>
            {pixelValue.value !== undefined ? (
              <span>Value: {formatValue(pixelValue.value)}</span>
            ) : (
              <span>R:{formatValue(pixelValue.r)} G:{formatValue(pixelValue.g)} B:{formatValue(pixelValue.b)}</span>
            )}
          </div>
        )}

        {/* Histogram panel */}
        <HistogramDisplay 
          histogram={histogram} 
          onClose={() => { setHistogram(null); setSelection(null); }}
        />
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
