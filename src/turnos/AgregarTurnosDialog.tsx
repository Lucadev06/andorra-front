import { useContext, useEffect, useState } from "react";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import BoyIcon from "@mui/icons-material/Boy";
import { GiBeard } from "react-icons/gi";
import { TurnosContext } from "../context/TurnosContextTypes";
import { useAuth } from '../context/AuthContext';
import { DisponibilidadContext } from '../context/DisponibilidadContext';
import { parseTurnoDate } from "../utils/dateUtils";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
  Paper,
  TextField,
  CircularProgress
} from "@mui/material";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';

interface AgregarTurnosDialogProps {
  open: boolean;
  onClose: () => void;
}

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

// Feriados (formato YYYY-MM-DD)
const feriados: string[] = [
  // "2024-12-25", 
  // "2025-01-01",
];

const isDomingo = (date: Date) => {
  return date.getDay() === 0; // 0 es Domingo
};

const isFeriado = (date: Date) => {
  const dateString = date.toISOString().split("T")[0];
  return feriados.includes(dateString);
};

export default function AgregarTurnosDialog({ open, onClose }: AgregarTurnosDialogProps) {
  // 1. Hooks
  const context = useContext(TurnosContext);
  const disponibilidadContext = useContext(DisponibilidadContext);
  const { user, isAuthenticated } = useAuth();
  const [servicio, setServicio] = useState<string>("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [hora, setHora] = useState<string>("");

  const shouldDisableDate = (date: Date) => {
    // Verificar si es día anterior
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(date);
    fechaSeleccionada.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      return true; // Días anteriores deshabilitados
    }
    // Primero verificar si es domingo - siempre deshabilitado
    if (isDomingo(date)) {
      return true;
    }
    // Verificar si es feriado
    if (isFeriado(date)) {
      return true;
    }
    // Verificar si el día está completamente bloqueado
    const dateString = date.toISOString().split("T")[0];
    const diaNoDisponible = disponibilidadContext?.diasNoDisponibles.find(d => {
      const diaFecha = typeof d.fecha === 'string' ? d.fecha : new Date(d.fecha).toISOString().split("T")[0];
      return diaFecha === dateString || d.fecha.startsWith(dateString);
    });
    if (diaNoDisponible && (!diaNoDisponible.horarios || diaNoDisponible.horarios.length === 0)) {
      return true; // Día completo bloqueado
    }
    return false;
  };

  // Effect for calculating available slots
  useEffect(() => {
    if (context && fecha && disponibilidadContext) {
      const { turnos } = context;
      const { diasNoDisponibles } = disponibilidadContext;
      const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
      const fechaISO = fecha.toISOString().split("T")[0];
      const turnosOcupados = turnos
        .filter(
          (t) => {
            const fechaTurno = parseTurnoDate(t.fecha);
            if (!fechaTurno) return false;
            const fechaTurnoISO = fechaTurno.toISOString().split("T")[0];
            return fechaTurnoISO === fechaISO;
          }
        )
        .map((t) => t.hora);
      
      const diaNoDisponible = diasNoDisponibles.find(d => d.fecha.startsWith(fechaISO));
      const horariosBloqueados = diaNoDisponible ? diaNoDisponible.horarios : [];

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
    } else {
      setHorarios([]);
    }
  }, [fecha, context, disponibilidadContext]); // Depend on context object

  // Effect for cleaning up the dialog state
  useEffect(() => {
    if (!open) {
      setFecha(null);
      setHora("");
      setServicio("");
      setHorarios([]);
    }
  }, [open]);

  // 2. Guard clause for context
  if (!context) {
    return null; // Or a loading spinner
  }

  // 3. Destructure from context
  const { addTurno } = context;

  // 4. Event Handlers
  async function handleConfirm() {
    if (!isAuthenticated || !user) {
      alert("Debes iniciar sesión para sacar un turno.");
      return;
    }
    if (!context) {
      return;
    }
    if (!servicio || !fecha || !hora) {
      alert("Completa todos los campos: servicio, fecha y horario.");
      return;
    }

    // Validación adicional: verificar que no sea domingo
    if (fecha && isDomingo(fecha)) {
      alert("❌ Los domingos no están disponibles para turnos.");
      return;
    }

    try {
      await addTurno({
        cliente: user.name,
        mail: user.email,
        fecha: fecha.toISOString().split("T")[0],
        hora,
        servicio,
      });
      alert("✅ Turno reservado con éxito");
      onClose();
    } catch (err: unknown) {
      console.error("Error creando turno:", err);
      if (err instanceof Error && err.message.includes("409")) {
        alert("❌ Este turno ya está ocupado. Por favor, elegí otro horario.");
      } else {
        alert("Error al reservar el turno.");
      }
    }
  }

  // 5. Render
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">

        <DialogTitle sx={{ fontWeight: "bold" }}>📅 Sacar turno</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Seleccioná el servicio:
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={2}>
            {[ 
              { key: "Corte", label: "Corte", icon: <ContentCutIcon /> },
              { key: "Barba", label: "Barba", icon: <GiBeard size={22} /> },
              {
                key: "Corte + Barba",
                label: "Corte + Barba",
                icon: (
                  <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                    <ContentCutIcon fontSize="small" /> <GiBeard size={20} />
                  </Box>
                ),
              },
            ].map((s) => (
              <Paper
                key={s.key}
                elevation={servicio === s.key ? 6 : 1}
                onClick={() => {
                  setServicio(s.key);
                }}
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                  backgroundColor: servicio === s.key ? "#f2a900" : "white",
                  color: servicio === s.key ? "black" : "inherit",
                  borderRadius: 2,
                  transition: "all 0.25s ease",
                  "&:hover": { backgroundColor: servicio === s.key ? "#f2a900" : "#f5f5f5" },
                }}
              >
                {s.icon}
                <Typography sx={{ mt: 1, fontWeight: "bold", textTransform: "capitalize" }}>
                  {s.label}
                </Typography>
              </Paper>
            ))}
          </Box>



          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Tus datos:
          </Typography>
          {isAuthenticated && user ? (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                label="Nombre"
                value={user.name}
              />
              <TextField
                fullWidth
                label="Email"
                value={user.email}
              />
              <Typography variant="caption" color="text.secondary">
                Tus datos se tomarán de tu cuenta de Google.
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth
                label="Nombre"
                value=""
                disabled
                helperText="Inicia sesión con Google para reservar un turno."
              />
              <TextField
                fullWidth
                label="Email"
                value=""
                disabled
              />
            </Box>
          )}

          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Seleccioná la fecha:
          </Typography>
          <DatePicker
            label="Fecha"
            value={fecha}
            onChange={(newDate) => {
              // Validar que no sea domingo antes de establecer la fecha
              if (newDate && isDomingo(newDate)) {
                alert("Los domingos no están disponibles para turnos.");
                return;
              }
              setFecha(newDate);
              setHora("");
            }}
            shouldDisableDate={shouldDisableDate}
            disablePast
            disabled={!servicio}
            slotProps={{
              textField: {
                helperText: "Los domingos no están disponibles"
              }
            }}
          />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
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
                No hay horarios disponibles
              </Typography>
            )}
          </ToggleButtonGroup>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={!hora}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
