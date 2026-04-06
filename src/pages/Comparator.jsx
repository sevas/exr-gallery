import { useState, useEffect, useRef, useCallback } from 'react'

function Comparator() {
  const BASE_URL = import.meta.env.BASE_URL

  // Sample images with blur levels
  const availableImages = [
    { name: 'Landscape - Original', file: 'landscape_original.jpg', group: 'landscape' },
    { name: 'Landscape - Medium Blur', file: 'landscape_blur_medium.jpg', group: 'landscape' },
    { name: 'Landscape - Heavy Blur', file: 'landscape_blur_heavy.jpg', group: 'landscape' },
    { name: 'Architecture - Original', file: 'architecture_original.jpg', group: 'architecture' },
    { name: 'Architecture - Medium Blur', file: 'architecture_blur_medium.jpg', group: 'architecture' },
    { name: 'Architecture - Heavy Blur', file: 'architecture_blur_heavy.jpg', group: 'architecture' },
    { name: 'Nature - Original', file: 'nature_original.jpg', group: 'nature' },
    { name: 'Nature - Medium Blur', file: 'nature_blur_medium.jpg', group: 'nature' },
    { name: 'Nature - Heavy Blur', file: 'nature_blur_heavy.jpg', group: 'nature' },
  ]

  const [selectedImages, setSelectedImages] = useState([null, null, null, null])
  const [imageResolutions, setImageResolutions] = useState([null, null, null, null])
  const [resolutionError, setResolutionError] = useState(null)
  
  // Pan and zoom state (synchronized across all views)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const containerRefs = useRef([])
  const gridRef = useRef(null)

  // Get active (non-null) image count
  const activeImageCount = selectedImages.filter(img => img !== null).length

  // Calculate grid layout based on number of images
  const getGridClass = () => {
    switch(activeImageCount) {
      case 1: return 'grid-1'
      case 2: return 'grid-2'
      case 3: return 'grid-3'
      default: return 'grid-4'
    }
  }

  // Handle image selection
  const handleImageSelect = (index, value) => {
    const newSelected = [...selectedImages]
    newSelected[index] = value || null
    setSelectedImages(newSelected)
    
    // Reset resolution for this slot
    const newResolutions = [...imageResolutions]
    newResolutions[index] = null
    setImageResolutions(newResolutions)
  }

  // Check image resolution when loaded
  const handleImageLoad = (index, event) => {
    const img = event.target
    const resolution = { width: img.naturalWidth, height: img.naturalHeight }
    
    const newResolutions = [...imageResolutions]
    newResolutions[index] = resolution
    setImageResolutions(newResolutions)
  }

  // Validate resolutions match
  useEffect(() => {
    const activeResolutions = imageResolutions.filter(r => r !== null)
    if (activeResolutions.length < 2) {
      setResolutionError(null)
      return
    }

    const first = activeResolutions[0]
    const mismatch = activeResolutions.some(
      r => r.width !== first.width || r.height !== first.height
    )

    if (mismatch) {
      setResolutionError('Warning: Images have different resolutions. Pan/zoom may not align perfectly.')
    } else {
      setResolutionError(null)
    }
  }, [imageResolutions])

  // Mouse wheel zoom - use native event listener with passive: false to prevent scroll
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return

    const handleWheel = (e) => {
      e.preventDefault()
      const step = e.ctrlKey ? 1 : 0.1
      const delta = e.deltaY > 0 ? -step : step
      setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 50))
    }

    grid.addEventListener('wheel', handleWheel, { passive: false })
    return () => grid.removeEventListener('wheel', handleWheel)
  }, [activeImageCount])

  // Mouse drag for panning
  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left click
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Reset view
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'r':
        case 'R':
          resetView()
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev + 0.2, 50))
          break
        case '-':
          setZoom(prev => Math.max(prev - 0.2, 0.5))
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="comparator-container">
      <h1>Image Comparator</h1>
      
      {/* Image Selection */}
      <div className="image-selectors">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="selector-wrapper">
            <label>Image {index + 1}:</label>
            <select
              value={selectedImages[index] || ''}
              onChange={(e) => handleImageSelect(index, e.target.value)}
            >
              <option value="">-- Select Image --</option>
              {availableImages.map((img) => (
                <option key={img.file} value={img.file}>
                  {img.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="comparator-controls">
        <div className="zoom-controls">
          <button onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}>−</button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.min(prev + 0.2, 50))}>+</button>
          <button onClick={resetView} className="reset-btn">Reset</button>
        </div>
        <p className="controls-hint">
          Scroll to zoom • Drag to pan • Press R to reset
        </p>
      </div>

      {/* Resolution warning */}
      {resolutionError && (
        <div className="resolution-warning">
          ⚠️ {resolutionError}
        </div>
      )}

      {/* Comparison Grid */}
      {activeImageCount > 0 ? (
        <div 
          ref={gridRef}
          className={`comparison-grid ${getGridClass()}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {selectedImages.map((img, index) => 
            img && (
              <div 
                key={index} 
                className="comparison-view"
                ref={el => containerRefs.current[index] = el}
              >
                <div className="image-label">{availableImages.find(i => i.file === img)?.name}</div>
                <div className="image-viewport">
                  <img
                    src={`${BASE_URL}samples/${img}`}
                    alt={`Comparison ${index + 1}`}
                    onLoad={(e) => handleImageLoad(index, e)}
                    style={{
                      transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                    draggable={false}
                  />
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="no-images-message">
          Select images above to start comparing
        </div>
      )}
    </div>
  )
}

export default Comparator
