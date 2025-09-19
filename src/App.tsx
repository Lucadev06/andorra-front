import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inicio from "./inicio/Inicio";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta inicial */}
        <Route path="/" element={<Inicio />} />
        {/* Ejemplo: en el futuro agregamos la página de turnos */}
        <Route path="/turnos" element={<h1>Página de turnos</h1>} />
        {/* Redirección fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
