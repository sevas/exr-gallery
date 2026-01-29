import { useState, useEffect } from 'react'
import './App.css'
import ExrImage from './ExrImage'

function App() {
  const images = [
    `${import.meta.env.BASE_URL}image1.exr`,
    `${import.meta.env.BASE_URL}image2.exr`,
    `${import.meta.env.BASE_URL}image3.exr`,
    `${import.meta.env.BASE_URL}image4.exr`,
    `${import.meta.env.BASE_URL}image5.exr`
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
    setIsAutoplay(false)
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setIsAutoplay(false)
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }

  const toggleAutoplay = () => {
    setIsAutoplay(!isAutoplay)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault()
          toggleAutoplay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          goToPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          goToNext()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAutoplay, currentIndex])

  return (
    <div className="app-container">
      <h1>Image Gallery</h1>
      <div className="carousel">
        <button className={`autoplay-button ${isAutoplay ? 'active' : ''}`} onClick={toggleAutoplay}>
          {isAutoplay ? '⏸ Pause' : '▶ Autoplay'}
        </button>
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
      </div>
      <p className="description">
        Image {currentIndex + 1} of {images.length}
      </p>
    </div>
  )
}

export default App
