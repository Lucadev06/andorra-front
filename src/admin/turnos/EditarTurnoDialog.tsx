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
  Box,
  Paper,
} from "@mui/material";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import { GiBeard } from "react-icons/gi";
import { useEffect, useState, useContext } from "react";
import { type Turno } from "../../context/TurnosContextTypes";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale';
import { TurnosContext } from "../../context/TurnosContextTypes";
import { DisponibilidadContext } from "../../context/DisponibilidadContext";
import { parseTurnoDate } from "../../utils/dateUtils";

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

interface EditarTurnoDialogProps {
  open: boolean;
  onClose: () => void;
  turno: Turno;
  onUpdated: (turnoEditado: Turno) => void;
}

export default function EditarTurnoDialog({
  open,
  onClose,
  turno,
  onUpdated,
}: EditarTurnoDialogProps) {
  const context = useContext(TurnosContext);
  const disponibilidadContext = useContext(DisponibilidadContext);
  const [cliente, setCliente] = useState("");
  const [mail, setMail] = useState("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [servicio, setServicio] = useState("");
  const [horarios, setHorarios] = useState<string[]>([]);
  const [initialTurno, setInitialTurno] = useState<Turno | null>(null);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (turno) {
      setInitialTurno(turno);
      setCliente(turno.cliente || "");
      setMail(turno.mail || "");
      // Convertir string de fecha a Date object
      const fechaStr = turno.fecha ? turno.fecha.substring(0, 10) : "";
      setFecha(fechaStr ? new Date(fechaStr + 'T00:00:00') : null);
      setHora(turno.hora || "");
      setServicio(turno.servicio || "");
      setHasChanged(false);
    }
  }, [turno]);

  // Effect for calculating available slots (igual que en AgregarTurnosDialog)
  useEffect(() => {
    if (context && fecha && disponibilidadContext) {
      const { turnos } = context;
      const { diasNoDisponibles } = disponibilidadContext;
      const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
      const fechaISO = fecha.toISOString().split("T")[0];
      
      // Obtener turnos ocupados en esa fecha, excluyendo el turno actual que se está editando
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

      const horariosLibres = todosLosHorarios.filter(
        (h) => !turnosOcupados.includes(h) && !horariosBloqueados.includes(h)
      );
      setHorarios(horariosLibres);
      
      // Si la hora actual no está en los horarios libres pero es la misma fecha, mantenerla
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

  useEffect(() => {
    if (!initialTurno) return;
    const fechaStr = fecha ? fecha.toISOString().split("T")[0] : "";
    const changes =
      initialTurno.cliente !== cliente ||
      initialTurno.mail !== mail ||
      initialTurno.fecha.substring(0, 10) !== fechaStr ||
      initialTurno.hora !== hora ||
      initialTurno.servicio !== servicio;

    setHasChanged(changes);
  }, [cliente, mail, fecha, hora, servicio, initialTurno]);

  const shouldDisableDate = (date: Date) => {
    // Primero verificar si es domingo - siempre deshabilitado
    if (isDomingo(date)) {
      return true;
    }
    // Verificar si el día está completamente bloqueado
    const dateString = date.toISOString().split("T")[0];
    const diaNoDisponible = disponibilidadContext?.diasNoDisponibles.find(d => {
      const diaFecha = typeof d.fecha === 'string' ? d.fecha : new Date(d.fecha).toISOString().split("T")[0];
      return diaFecha === dateString || d.fecha.startsWith(dateString);
    });
    // Un día está completamente bloqueado si tiene todos los horarios bloqueados
    const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
    if (diaNoDisponible && Array.isArray(diaNoDisponible.horarios) && diaNoDisponible.horarios.length === todosLosHorarios.length) {
      return true; // Día completo bloqueado
    }
    return false;
  };

  async function handleSave() {
    if (!cliente || !fecha || !hora) {
      alert("Todos los campos son obligatorios");
      return;
    }

    // Validar que no sea domingo
    if (fecha && isDomingo(fecha)) {
      alert("❌ Los domingos no están disponibles para turnos.");
      return;
    }

    // Validar que el horario esté disponible
    if (!horarios.includes(hora)) {
      alert("❌ Este horario no está disponible. Por favor, elegí otro horario.");
      return;
    }

    const fechaStr = fecha.toISOString().split("T")[0];
    const turnoActualizado = {
      ...turno,
      cliente,
      mail,
      fecha: fechaStr, // yyyy-MM-dd string
      hora,
      servicio,
    };

    try {
      await onUpdated(turnoActualizado as Turno);
      alert("✅ Turno actualizado con éxito");
      onClose();
    } catch (error: unknown) {
      console.error("Error actualizando turno:", error);
      if (error instanceof Error && error.message.includes("409")) {
        alert("❌ Este turno ya está ocupado. Por favor, elegí otro horario.");
      } else {
        alert("Error al actualizar el turno");
      }
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
        <DialogTitle>✏️ Editar turno</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            fullWidth
          />

          <TextField
            label="Mail"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            fullWidth
          />

          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mt: 1 }}>
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
          <Button onClick={handleSave} variant="contained" disabled={!hasChanged || !hora}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
