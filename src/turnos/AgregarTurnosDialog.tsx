import { useContext, useEffect, useState } from "react";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import BoyIcon from "@mui/icons-material/Boy";
import { GiBeard } from "react-icons/gi";
import { TurnosContext } from "../context/TurnosContextTypes";
import { useAuth } from '../context/AuthContext';
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

interface Peluquero {
  _id: string;
  nombre: string;
  servicios: string[];
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

const shouldDisableDate = (date: Date) => {
  return isDomingo(date) || isFeriado(date);
};

export default function AgregarTurnosDialog({ open, onClose }: AgregarTurnosDialogProps) {
  // 1. Hooks
  const context = useContext(TurnosContext);
  const { user, isAuthenticated } = useAuth();
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState<string>("");
  const [servicio, setServicio] = useState<string>("");
  const [fecha, setFecha] = useState<Date | null>(null);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [hora, setHora] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const API_URL = "https://andorra-back-1.onrender.com/api";

  // Effect for fetching barbers
  useEffect(() => {
    const fetchPeluqueros = async () => {
      if (open) {
        setIsLoading(true);
        try {

          const res = await fetch(`${API_URL}/peluqueros`);
          const data = (await res.json()) as Peluquero[];
          setPeluqueros(data);
        } catch (err) {
          console.error("Error obteniendo peluqueros:", err);
        }
      }
    };
    void fetchPeluqueros();
    setIsLoading(false);
  }, [open]);

  // Effect for calculating available slots
  useEffect(() => {
    if (context && peluqueroSeleccionado && fecha) {
      const { turnos } = context;
      const todosLosHorarios = generarHorarios("10:00", "20:00", 30);
      const fechaISO = fecha.toISOString().split("T")[0];
      const turnosOcupados = turnos
        .filter(
          (t) =>
            (typeof t.peluquero === 'string' ? t.peluquero : t.peluquero._id) === peluqueroSeleccionado &&
            new Date(t.fecha).toISOString().split("T")[0] === fechaISO
        )
        .map((t) => t.hora);

      const horariosLibres = todosLosHorarios.filter(
        (h) => !turnosOcupados.includes(h)
      );
      setHorarios(horariosLibres);
    } else {
      setHorarios([]);
    }
  }, [peluqueroSeleccionado, fecha, context]); // Depend on context object

  // Effect for cleaning up the dialog state
  useEffect(() => {
    if (!open) {
      setFecha(null);
      setHora("");
      setPeluqueroSeleccionado("");
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
    if (!servicio || !peluqueroSeleccionado || !fecha || !hora) {
      alert("Completa todos los campos: servicio, barbero, fecha y horario.");
      return;
    }

    try {
      await addTurno({
        cliente: user.name,
        mail: user.email,
        peluquero: peluqueroSeleccionado,
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
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",

            }}
          >
            <CircularProgress sx={{color: "orange"}}/>
          </Box>
        )}
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
                  setPeluqueroSeleccionado("");
                  setFecha(null);
                  setHora("");
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
            Seleccioná tu barbero:
          </Typography>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))" gap={2}>
            {peluqueros.map((p) => (
              <Paper
                key={p._id}
                elevation={peluqueroSeleccionado === p._id ? 6 : 1}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.stopPropagation();
                  if (!servicio) return;
                  setPeluqueroSeleccionado(p._id);
                  setFecha(null);
                  setHora("");
                }}
                sx={{
                  p: 2,
                  textAlign: "center",
                  cursor: servicio ? "pointer" : "not-allowed",
                  backgroundColor:
                    peluqueroSeleccionado === p._id ? "#f2a900" : "white",
                  color: servicio
                    ? peluqueroSeleccionado === p._id
                      ? "black"
                      : "inherit"
                    : "gray",
                  borderRadius: 2,
                  transition: "all 0.25s ease",
                  opacity: servicio ? 1 : 0.5,
                }}
              >
                <BoyIcon sx={{ fontSize: 40 }} />
                <Typography sx={{ mt: 1, fontWeight: "bold" }}>{p.nombre}</Typography>
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
              setFecha(newDate);
              setHora("");
            }}
            shouldDisableDate={shouldDisableDate}
            disablePast
            disabled={!peluqueroSeleccionado}
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
