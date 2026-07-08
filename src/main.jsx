import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'maplibre-gl/dist/maplibre-gl.css';
import App from './App.jsx';
import { AximProvider } from './context/AximContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AximProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AximProvider>
  </StrictMode>
);