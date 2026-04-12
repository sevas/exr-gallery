import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <nav className="main-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Gallery
        </NavLink>
        <NavLink to="/compare" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Comparator
        </NavLink>
        <NavLink to="/viewer" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          Viewer
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}

export default App
