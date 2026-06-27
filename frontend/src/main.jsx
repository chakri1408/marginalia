import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import './index.css'
import Landing from './pages/Landing.jsx'
import Notebook from './pages/Notebook.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/notebook/:id" element={<Notebook />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)