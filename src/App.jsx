import { useState, useEffect } from 'react'
import './App.css'
import ExrImage from './ExrImage'

function App() {
  const images = [
    '/image1.exr',
    '/image2.exr',
    '/image3.exr',
    '/image4.exr',
    '/image5.exr'
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoplay, setIsAutoplay] = useState(false)

  useEffect(() => {
    if (!isAutoplay) return

    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isAutoplay, images.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay)
  }

  return (
    <div className="app-container">
      <h1>Image Gallery</h1>
      <div className="carousel">
        <div className="image-container">
          <ExrImage 
            src={images[currentIndex]} 
            alt={`Gallery image ${currentIndex + 1}`} 
          />
        </div>
        <div className="nav-buttons">
          <button className="nav-button prev" onClick={goToPrevious}>
            ❮
          </button>
          <button className="nav-button next" onClick={goToNext}>
            ❯
          </button>
        </div>
        <button className={`autoplay-button ${isAutoplay ? 'active' : ''}`} onClick={toggleAutoplay}>
          {isAutoplay ? '⏸ Pause' : '▶ Autoplay'}
        </button>
      </div>
      <p className="description">
        Image {currentIndex + 1} of {images.length}
      </p>
    </div>
  )
}

export default App
