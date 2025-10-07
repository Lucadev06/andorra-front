import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from './config.ts';
import { AuthProvider } from './context/AuthContext';
import Inicio from "./inicio/Inicio";
import Admin from "./admin/Admin";
import Turnos from "./turnos/Turnos";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta inicial */}
            <Route path="/" element={<Inicio />} />
            {/* Ejemplo: en el futuro agregamos la página de turnos */}
            <Route path="/turnos" element={<Turnos />} />
            {/* Redirección fallback */}
            <Route path="*" element={<Navigate to="/" />} />
            <Route path="/admin" element={<Admin/>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
