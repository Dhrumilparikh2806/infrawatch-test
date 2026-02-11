import 'leaflet/dist/leaflet.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import InfraWatch from './InfraWatch'
import './index.css'   // ← THIS LINE MUST EXIST

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <InfraWatch />
  </React.StrictMode>,
)
