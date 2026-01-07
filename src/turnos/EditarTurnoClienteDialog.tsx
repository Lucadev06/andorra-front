import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
} from "@mui/material";
import { useEffect, useState, useContext } from "react";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import { TurnosContext } from "../context/TurnosContextTypes";
import { DisponibilidadContext } from "../context/DisponibilidadContext";
import { parseTurnoDate } from "../utils/dateUtils";

// Helper function to generate time slots
const generarHorarios = (inicio: string, fin: string, intervalo: number) => {
  const horarios = [];
  let [hora, minuto] = inicio.split(":").map(Number);

  while (true) {
    const horarioActual = `${String(hora).padStart(2, "0")}:${String(
      minuto
    ).padStart(2, "0")}`;
    if (horarioActual >= fin) break;
    horarios.push(horarioActual);

    minuto += intervalo;
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60);
      minuto %= 60;
    }
  }
  return horarios;
};

const isDomingo = (date: Date) => {
  return date.getDay() === 0; // 0 es Domingo
};

interface Turno {
  _id: string;
  fecha: string;
  hora: string;
  cliente: string;
  mail: string;
  servicio?: string;
}

interface EditarTurnoClienteDialogProps {
  open: boolean;
  onClose: () => void;
  turno: Turno;
  onUpdated: () => void;
}

const API_URL = "https://andorra-back-1.onrender.com/api";

export default function EditarTurnoClienteDialog({
  open,
  onClose,
  turno,
  onUpdated,
}: EditarTurnoClienteDialogProps) {
  const context = useContext(TurnosContext);
  const disponibilidadContext = useContext(DisponibilidadContext);
  const [servicio, setServicio] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (turno) {
      setServicio(turno.servicio || "");
      const fechaStr = turno.fecha ? turno.fecha.substring(0, 10) : "";
      setFecha(fechaStr ? new Date(fechaStr + 'T00:00:00') : null);
      setHora(turno.hora || "");
      setError("");
    }
  }, [turno]);

  // Effect for calculating available slots
  useEffect(() => {
    if (context && fecha && disponibilidadContext) {
      const { turnos } = context;
      const { diasNoDisponibles } = disponibilidadContext;
      const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
      const fechaISO = fecha.toISOString().split("T")[0];
      
      // Obtener turnos ocupados en esa fecha, excluyendo el turno actual
      const turnosOcupados = turnos
        .filter(
          (t) => {
            if (t._id === turno._id) return false; // Excluir el turno actual
            const fechaTurno = parseTurnoDate(t.fecha);
            if (!fechaTurno) return false;
            const fechaTurnoISO = fechaTurno.toISOString().split("T")[0];
            return fechaTurnoISO === fechaISO;
          }
        )
        .map((t) => t.hora);
      
      const diaNoDisponible = diasNoDisponibles.find(d => {
        const diaFecha = typeof d.fecha === 'string' ? d.fecha : new Date(d.fecha).toISOString().split("T")[0];
        return diaFecha === fechaISO || d.fecha.startsWith(fechaISO);
      });
      const horariosBloqueados = diaNoDisponible ? (Array.isArray(diaNoDisponible.horarios) ? diaNoDisponible.horarios : []) : [];

      // Si es el día de hoy, filtrar horarios pasados
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaSeleccionada = new Date(fecha);
      fechaSeleccionada.setHours(0, 0, 0, 0);
      const esHoy = fechaSeleccionada.getTime() === hoy.getTime();
      
      const horaActual = new Date();
      const horaActualStr = `${String(horaActual.getHours()).padStart(2, "0")}:${String(horaActual.getMinutes()).padStart(2, "0")}`;

      const horariosLibres = todosLosHorarios.filter(
        (h) => {
          // Si es hoy, excluir horarios pasados
          if (esHoy && h <= horaActualStr) {
            return false;
          }
          return !turnosOcupados.includes(h) && !horariosBloqueados.includes(h);
        }
      );
      setHorarios(horariosLibres);
      
      // Si cambió la fecha y la hora actual no está disponible, limpiar la hora
      if (fechaISO !== (turno.fecha ? turno.fecha.substring(0, 10) : "")) {
        if (!horariosLibres.includes(hora)) {
          setHora("");
        }
      }
    } else {
      setHorarios([]);
    }
  }, [fecha, context, disponibilidadContext, turno._id, turno.fecha, hora]);

  const shouldDisableDate = (date: Date) => {
    // Verificar si es día anterior
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(date);
    fechaSeleccionada.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      return true; // Días anteriores deshabilitados
    }
    if (isDomingo(date)) {
      return true;
    }
    const dateString = date.toISOString().split("T")[0];
    const diaNoDisponible = disponibilidadContext?.diasNoDisponibles.find(d => {
      const diaFecha = typeof d.fecha === 'string' ? d.fecha : new Date(d.fecha).toISOString().split("T")[0];
      return diaFecha === dateString || d.fecha.startsWith(dateString);
    });
    const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
    if (diaNoDisponible && Array.isArray(diaNoDisponible.horarios) && diaNoDisponible.horarios.length === todosLosHorarios.length) {
      return true;
    }
    return false;
  };

  // Validar que se pueda editar (6 horas de anticipación)
  const puedeEditar = (): { puede: boolean; razon?: string } => {
    const fechaTurno = parseTurnoDate(turno.fecha);
    if (!fechaTurno) return { puede: false, razon: "Fecha inválida" };

    const [horaTurno, minutoTurno] = turno.hora.split(":").map(Number);
    const fechaHoraTurno = new Date(fechaTurno);
    fechaHoraTurno.setHours(horaTurno, minutoTurno, 0, 0);

    const ahora = new Date();
    const diferenciaMs = fechaHoraTurno.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras <= 6) {
      const horasRestantes = Math.max(0, Math.round(diferenciaHoras * 10) / 10);
      return { 
        puede: false, 
        razon: `No se puede editar. Debe editarse con más de 6 horas de anticipación. Faltan ${horasRestantes} horas.` 
      };
    }

    return { puede: true };
  };

  async function handleSave() {
    const validacion = puedeEditar();
    if (!validacion.puede) {
      setError(validacion.razon || "No se puede editar este turno");
      return;
    }

    if (!fecha || !hora) {
      setError("Fecha y hora son obligatorios");
      return;
    }

    if (fecha && isDomingo(fecha)) {
      setError("Los domingos no están disponibles para turnos.");
      return;
    }

    if (!horarios.includes(hora)) {
      setError("Este horario no está disponible. Por favor, elegí otro horario.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const fechaStr = fecha.toISOString().split("T")[0];
      const response = await fetch(`${API_URL}/turnos/editar/${turno._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fecha: fechaStr,
          hora,
          servicio,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Turno actualizado con éxito");
        onUpdated();
        onClose();
      } else {
        setError(data.error || "Error al actualizar el turno");
      }
    } catch (err) {
      console.error("Error actualizando turno:", err);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  const validacion = puedeEditar();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>✏️ Editar mi turno</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {!validacion.puede && validacion.razon && (
            <Alert severity="warning">{validacion.razon}</Alert>
          )}
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            label="Servicio"
            value={servicio}
            onChange={(e) => setServicio(e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Seleccioná la fecha:
          </Typography>
          <DatePicker
            label="Fecha"
            value={fecha}
            onChange={(newDate) => {
              if (newDate && isDomingo(newDate)) {
                alert("Los domingos no están disponibles para turnos.");
                return;
              }
              setFecha(newDate);
              setHora(""); // Limpiar hora al cambiar fecha
            }}
            shouldDisableDate={shouldDisableDate}
            slotProps={{
              textField: {
                helperText: "Los domingos no están disponibles"
              }
            }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
            Seleccioná un horario:
          </Typography>
          <ToggleButtonGroup
            value={hora || null}
            exclusive
            onChange={(_, value) => setHora(value)}
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {horarios.length > 0 ? (
              horarios.map((h) => (
                <ToggleButton
                  key={h}
                  value={h}
                  disabled={!fecha}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #ccc",
                    textTransform: "none",
                    px: 2,
                    "&.Mui-selected": {
                      backgroundColor: "#f2a900",
                      color: "black",
                      fontWeight: "bold",
                    },
                  }}
                >
                  {h}
                </ToggleButton>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {fecha ? "No hay horarios disponibles para esta fecha" : "Seleccioná una fecha primero"}
              </Typography>
            )}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={!validacion.puede || !hora || loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}

