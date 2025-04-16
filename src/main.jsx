import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'primereact/resources/themes/bootstrap4-light-blue/theme.css';
import App from './App.jsx'

import { PrimeReactProvider } from 'primereact/api';
import { LocalizationProvider } from './LocalizationProvider.jsx';
        

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocalizationProvider>
      <PrimeReactProvider>
        <App />
      </PrimeReactProvider>
    </LocalizationProvider>
  </StrictMode>,
)
