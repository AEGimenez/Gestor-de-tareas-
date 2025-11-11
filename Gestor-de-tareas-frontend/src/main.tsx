import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '../App.tsx' // <-- ¡Ahora sí apuntamos a tu App!
import './style.css'     // Mantenemos tus estilos globales

// Usamos el id="app" de tu index.html y renderizamos React
ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)