import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import './global.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)
