import { useState, useEffect, useRef, useCallback } from 'react'
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js'

// Colormap lookup tables (256 entries each)
const COLORMAPS = {
  gray: Array.from({ length: 256 }, (_, i) => [i, i, i]),
  viridis: generateViridis(),
  plasma: generatePlasma(),
}

function generateViridis() {
  // Viridis colormap approximation
  const colors = []
  for (let i = 0; i < 256; i++) {
    const t = i / 255
    const r = Math.round(255 * (0.267004 + t * (0.329415 + t * (-0.456714 + t * 0.596662))))
    const g = Math.round(255 * (0.004874 + t * (0.873465 + t * (-0.171337 + t * -0.223494))))
    const b = Math.round(255 * (0.329415 + t * (0.456714 + t * (-0.596662 + t * 0.596662))))
    colors.push([
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b))
    ])
  }
  // Use actual viridis values for better accuracy
  return [
    [68,1,84],[68,2,86],[69,4,87],[69,5,89],[70,7,90],[70,8,92],[70,10,93],[70,11,94],
    [71,13,96],[71,14,97],[71,16,99],[71,17,100],[71,19,101],[72,20,103],[72,22,104],[72,23,105],
    [72,24,106],[72,26,108],[72,27,109],[72,28,110],[72,29,111],[72,31,112],[72,32,113],[72,33,115],
    [72,35,116],[72,36,117],[72,37,118],[72,38,119],[72,40,120],[72,41,121],[71,42,122],[71,44,122],
    [71,45,123],[71,46,124],[71,47,125],[70,48,126],[70,50,126],[70,51,127],[69,52,128],[69,53,129],
    [68,55,129],[68,56,130],[67,57,131],[67,58,131],[66,59,132],[66,61,132],[65,62,133],[65,63,133],
    [64,64,134],[63,65,134],[63,66,134],[62,68,135],[61,69,135],[61,70,135],[60,71,136],[59,72,136],
    [59,73,136],[58,74,136],[57,75,137],[56,76,137],[56,77,137],[55,78,137],[54,79,137],[53,80,138],
    [52,81,138],[52,82,138],[51,83,138],[50,84,138],[49,85,138],[48,86,138],[47,87,138],[46,88,138],
    [46,89,138],[45,90,138],[44,91,138],[43,92,138],[42,93,138],[41,94,138],[40,95,138],[39,96,138],
    [38,97,138],[37,98,138],[36,99,138],[35,100,137],[34,101,137],[33,102,137],[32,103,137],[31,104,137],
    [30,105,137],[29,106,136],[28,107,136],[27,108,136],[26,109,135],[25,110,135],[24,111,135],[23,112,134],
    [22,113,134],[21,114,134],[20,115,133],[19,116,133],[18,117,132],[17,118,132],[16,119,131],[15,120,131],
    [14,121,130],[13,122,130],[12,123,129],[11,124,129],[10,125,128],[10,126,128],[9,127,127],[8,128,126],
    [8,129,126],[7,130,125],[7,131,124],[6,132,124],[6,133,123],[5,134,122],[5,135,122],[5,136,121],
    [5,137,120],[5,138,119],[5,139,119],[5,140,118],[5,141,117],[5,142,116],[6,143,115],[6,144,115],
    [6,145,114],[7,146,113],[7,147,112],[8,148,111],[9,149,110],[9,150,109],[10,151,108],[11,152,107],
    [12,153,106],[13,154,105],[14,155,104],[15,156,103],[16,157,102],[18,158,101],[19,159,100],[20,160,99],
    [22,161,98],[23,162,96],[25,163,95],[26,164,94],[28,165,93],[30,166,91],[31,167,90],[33,168,89],
    [35,169,87],[37,170,86],[39,171,85],[41,172,83],[43,173,82],[45,174,80],[47,175,79],[49,176,77],
    [51,177,76],[53,178,74],[55,179,73],[58,180,71],[60,181,69],[62,182,68],[64,183,66],[67,184,64],
    [69,185,63],[71,186,61],[74,187,59],[76,188,57],[79,189,55],[81,190,53],[84,191,51],[86,192,49],
    [89,193,47],[92,194,46],[94,195,44],[97,196,42],[100,197,40],[102,198,38],[105,199,36],[108,200,34],
    [111,201,31],[114,202,29],[117,203,27],[120,204,25],[123,205,23],[126,206,20],[129,207,18],[132,208,16],
    [136,209,13],[139,210,11],[142,211,9],[145,212,7],[149,213,5],[152,214,3],[155,215,2],[159,216,1],
    [162,217,1],[166,218,1],[169,219,2],[172,220,3],[176,221,5],[179,222,7],[183,223,9],[186,224,12],
    [189,225,15],[193,226,18],[196,227,22],[199,228,25],[203,229,29],[206,230,33],[209,231,37],[212,232,42],
    [215,233,46],[219,234,51],[222,235,55],[225,236,60],[228,237,65],[231,238,70],[234,239,75],[237,240,80],
    [240,241,85],[243,242,91],[246,243,96],[249,244,102],[251,245,107],[254,246,113],[254,247,119],[254,248,125],
    [254,249,131],[254,250,137],[254,251,143],[253,252,149],[253,253,155],[253,254,161],[253,255,167],[253,255,173]
  ].slice(0, 256)
}

function generatePlasma() {
  // Plasma colormap
  return [
    [13,8,135],[16,7,138],[19,6,141],[22,6,144],[25,5,147],[28,5,150],[31,4,153],[33,4,155],
    [36,4,158],[39,3,161],[41,3,163],[44,2,166],[47,2,168],[49,2,170],[52,2,172],[55,1,175],
    [57,1,177],[60,1,179],[62,1,181],[65,1,182],[68,1,184],[70,1,186],[73,1,187],[75,1,189],
    [78,1,190],[81,1,191],[83,1,193],[86,1,194],[88,1,195],[91,1,196],[94,1,197],[96,1,198],
    [99,1,199],[101,1,199],[104,1,200],[107,1,201],[109,1,201],[112,1,202],[114,2,202],[117,2,203],
    [119,3,203],[122,3,203],[124,4,203],[127,5,203],[129,6,203],[132,7,203],[134,8,203],[136,9,203],
    [139,11,203],[141,12,202],[143,14,202],[146,15,202],[148,17,201],[150,19,201],[152,21,200],[155,23,200],
    [157,25,199],[159,27,198],[161,29,197],[163,31,196],[165,33,195],[167,35,194],[169,38,193],[171,40,192],
    [173,42,191],[175,45,190],[177,47,189],[178,50,187],[180,52,186],[182,55,185],[184,57,183],[185,60,182],
    [187,62,180],[189,65,179],[190,68,177],[192,70,176],[193,73,174],[195,76,172],[196,79,171],[198,81,169],
    [199,84,167],[200,87,165],[202,90,163],[203,93,161],[204,96,159],[206,98,157],[207,101,155],[208,104,153],
    [209,107,151],[210,110,149],[211,113,147],[212,116,145],[213,119,143],[214,122,141],[215,125,139],[216,128,137],
    [217,131,134],[218,134,132],[219,137,130],[220,140,128],[220,143,126],[221,146,123],[222,149,121],[223,152,119],
    [223,155,117],[224,158,115],[225,161,112],[226,164,110],[226,167,108],[227,170,106],[228,173,104],[228,176,102],
    [229,179,100],[230,182,97],[230,185,95],[231,188,93],[231,191,91],[232,194,89],[232,197,87],[233,200,86],
    [233,203,84],[234,206,82],[234,209,80],[235,212,78],[235,215,77],[236,218,75],[236,221,74],[236,224,72],
    [237,227,71],[237,230,69],[237,233,68],[238,236,67],[238,239,66],[239,242,65],[239,245,64],[239,248,63],
    [240,251,62],[240,254,62],[241,255,61],[241,255,61],[242,255,60],[242,255,60],[243,255,59],[243,255,59],
    [244,255,58],[244,255,58],[245,255,58],[245,255,57],[245,255,57],[246,255,57],[246,255,56],[247,255,56],
    [247,255,56],[248,255,55],[248,255,55],[248,255,55],[249,255,55],[249,255,54],[250,255,54],[250,255,54],
    [250,255,54],[251,255,54],[251,255,53],[251,255,53],[252,255,53],[252,255,53],[252,255,53],[253,255,53],
    [253,255,53],[253,255,52],[254,255,52],[254,255,52],[254,254,52],[254,254,52],[254,254,52],[254,254,52],
    [254,253,52],[254,253,52],[254,253,52],[254,252,53],[254,252,53],[254,251,53],[254,251,53],[254,250,53],
    [254,250,53],[254,249,54],[254,249,54],[254,248,54],[254,248,54],[254,247,55],[254,247,55],[254,246,55],
    [254,246,56],[254,245,56],[254,245,57],[254,244,57],[254,244,57],[254,243,58],[254,243,58],[254,242,59],
    [253,241,59],[253,241,60],[253,240,60],[253,240,61],[253,239,62],[253,238,62],[253,238,63],[253,237,64],
    [252,236,64],[252,236,65],[252,235,66],[252,234,67],[252,234,67],[251,233,68],[251,232,69],[251,232,70],
    [251,231,71],[250,230,72],[250,229,72],[250,229,73],[250,228,74],[249,227,75],[249,226,76],[249,226,77],
    [248,225,78],[248,224,79],[248,223,80],[247,222,81],[247,222,82],[247,221,83],[246,220,84],[246,219,85],
    [246,218,87],[245,218,88],[245,217,89],[244,216,90],[244,215,91],[243,214,93],[243,213,94],[243,212,95],
    [242,212,96],[242,211,98],[241,210,99],[241,209,100],[240,208,102],[240,207,103],[239,206,104],[239,205,106],
    [238,204,107],[237,203,109],[237,202,110],[236,201,112],[236,200,113],[235,199,115],[234,198,116],[234,197,118]
  ].slice(0, 256)
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
            <div className="control-group">
              <label>Min Level:</label>
              <input
                type="number"
                step={imageData.dtype === 'float32' ? 0.01 : 1}
                value={minLevel}
                onChange={(e) => setMinLevel(parseFloat(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label>Max Level:</label>
              <input
                type="number"
                step={imageData.dtype === 'float32' ? 0.01 : 1}
                value={maxLevel}
                onChange={(e) => setMaxLevel(parseFloat(e.target.value))}
              />
            </div>

            <button onClick={resetLevels}>Auto Levels</button>

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
