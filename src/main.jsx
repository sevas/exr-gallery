import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Gallery from './pages/Gallery.jsx'
import Comparator from './pages/Comparator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Gallery />} />
          <Route path="compare" element={<Comparator />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
