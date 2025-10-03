import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./inicio/Inicio";
import Admin from "./admin/Admin";
import Turnos from "./turnos/Turnos";

function App() {
  return (
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
  );
}

export default App;
