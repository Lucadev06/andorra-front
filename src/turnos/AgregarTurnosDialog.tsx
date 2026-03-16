import { useContext, useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import { GiBeard } from "react-icons/gi";
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
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TurnosContext } from "../context/TurnosContextTypes";
import { useAuth } from "../context/AuthContext";
import { DisponibilidadContext } from "../context/DisponibilidadContext";
import { parseTurnoDate } from "../utils/dateUtils";
import {
  getFixedSlotsByDate,
  isDateWithinAdvanceBookingWindow,
  isTimeAllowedForDate,
  MAX_ADVANCE_BOOKING_DAYS,
} from "../utils/fixedSchedule.ts";

interface AgregarTurnosDialogProps {
  open: boolean;
  onClose: () => void;
}

const isDomingo = (date: Date) => date.getDay() === 0;

const getDateKey = (date: Date) =>
  new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    .toISOString()
    .split("T")[0];

const normalizeStoredDate = (value: string | Date) => {
  if (typeof value === "string") {
    return value.split("T")[0];
  }

  return new Date(value).toISOString().split("T")[0];
};

export default function AgregarTurnosDialog({ open, onClose }: AgregarTurnosDialogProps) {
  const context = useContext(TurnosContext);
  const disponibilidadContext = useContext(DisponibilidadContext);
  const { user, isAuthenticated } = useAuth();

  const [fecha, setFecha] = useState<Date | null>(null);
  const [hora, setHora] = useState("");
  const [openDetalleModal, setOpenDetalleModal] = useState(false);
  const [servicio, setServicio] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    if (!open) {
      setFecha(null);
      setHora("");
      setOpenDetalleModal(false);
      setServicio("");
      setTelefono("");
    }
  }, [open]);

  if (!context || !disponibilidadContext) {
    return null;
  }

  const { addTurno, turnos } = context;
  const { diasNoDisponibles } = disponibilidadContext;

  const minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  const maxDate = new Date(minDate);
  maxDate.setDate(maxDate.getDate() + MAX_ADVANCE_BOOKING_DAYS);

  const getAvailableSlotsForDate = (selectedDate: Date | null) => {
    if (!selectedDate) return [];

    const fechaISO = getDateKey(selectedDate);
    const daySlots = getFixedSlotsByDate(selectedDate);
    if (daySlots.length === 0) return [];

    const turnosOcupados = turnos
      .filter((t) => {
        const fechaTurno = parseTurnoDate(t.fecha);
        if (!fechaTurno) return false;
        return getDateKey(fechaTurno) === fechaISO;
      })
      .map((t) => t.hora);

    const diaNoDisponible = diasNoDisponibles.find((d) => normalizeStoredDate(d.fecha) === fechaISO);
    const horariosBloqueados =
      diaNoDisponible && Array.isArray(diaNoDisponible.horarios)
        ? diaNoDisponible.horarios
        : [];

    const isFullDayBlocked =
      !!diaNoDisponible &&
      (horariosBloqueados.length === 0 || daySlots.every((slot: string) => horariosBloqueados.includes(slot)));

    if (isFullDayBlocked) return [];

    const today = new Date();
    const isToday = getDateKey(today) === fechaISO;
    const nowTime = `${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`;

    return daySlots.filter((slot: string) => {
      if (isToday && slot <= nowTime) return false;
      return !turnosOcupados.includes(slot) && !horariosBloqueados.includes(slot);
    });
  };

  const horariosDisponibles = getAvailableSlotsForDate(fecha);

  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== "month") return false;

    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);

    if (normalized < minDate) return true;
    if (normalized > maxDate) return true;
    if (!isDateWithinAdvanceBookingWindow(normalized)) return true;
    if (isDomingo(normalized)) return true;

    return getFixedSlotsByDate(normalized).length === 0;
  };

  const handleDateChange = (value: unknown) => {
    if (!(value instanceof Date)) return;

    if (isDomingo(value)) {
      alert("Los domingos no están disponibles para turnos.");
      return;
    }

    setFecha(value);
    setHora("");
  };

  const handleOpenDetails = () => {
    if (!fecha || !hora) {
      alert("Seleccioná día y horario para continuar.");
      return;
    }

    setOpenDetalleModal(true);
  };

  const handleConfirm = async () => {
    if (!isAuthenticated || !user) {
      alert("Debes iniciar sesión para sacar un turno.");
      return;
    }

    if (!fecha || !hora || !servicio) {
      alert("Completá todos los campos.");
      return;
    }

    const telefonoNormalizado = telefono.trim();
    if (telefonoNormalizado.length < 8) {
      alert("Ingresá un número de teléfono válido.");
      return;
    }

    if (!isDateWithinAdvanceBookingWindow(fecha)) {
      alert("Solo se puede reservar hasta 14 días de anticipación.");
      return;
    }

    if (!isTimeAllowedForDate(fecha, hora)) {
      alert("Ese horario no está habilitado para el día seleccionado.");
      return;
    }

    try {
      await addTurno({
        cliente: user.name,
        mail: user.email,
        telefono: telefonoNormalizado,
        fecha: fecha.toISOString().split("T")[0],
        hora,
        servicio,
      });

      alert("✅ Turno reservado con éxito");
      setOpenDetalleModal(false);
      onClose();
    } catch (err: unknown) {
      console.error("Error creando turno:", err);
      if (err instanceof Error && err.message.includes("409")) {
        alert("❌ Este turno ya está ocupado. Por favor, elegí otro horario.");
      } else {
        alert("Error al reservar el turno.");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>📅 Sacar turno</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Podés sacar turno para hoy, mañana o cualquier día hasta 14 días de anticipación.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Calendar
              onChange={handleDateChange}
              value={fecha}
              locale="es"
              tileDisabled={tileDisabled}
              minDate={minDate}
              maxDate={maxDate}
              className="mini-calendar"
            />
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {fecha
              ? `Horarios disponibles para ${format(fecha, "d 'de' MMMM", { locale: es })}`
              : "Seleccioná un día para ver horarios"}
          </Typography>

          <ToggleButtonGroup
            value={hora || null}
            exclusive
            onChange={(_, value) => setHora(value || "")}
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {horariosDisponibles.length > 0 ? (
              horariosDisponibles.map((slot: string) => (
                <ToggleButton
                  key={slot}
                  value={slot}
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
                  {slot}
                </ToggleButton>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                {fecha ? "No hay horarios disponibles para este día" : ""}
              </Typography>
            )}
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleOpenDetails} disabled={!fecha || !hora}>
            Continuar
          </Button>
        </DialogActions>

        <style>{`
          .mini-calendar {
            width: 100% !important;
            max-width: 320px;
            border: 1px solid #e0e0e0 !important;
            border-radius: 12px;
            padding: 8px;
          }
          .mini-calendar .react-calendar__tile--active {
            background: #f2a900 !important;
            color: #000 !important;
          }
        `}</style>
      </Dialog>

      <Dialog open={openDetalleModal} onClose={() => setOpenDetalleModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: "bold" }}>Confirmar turno</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {fecha ? `Día: ${format(fecha, "d 'de' MMMM yyyy", { locale: es })}` : ""}
            {hora ? ` · Hora: ${hora}` : ""}
          </Typography>

          <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
            Servicio:
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
                onClick={() => setServicio(s.key)}
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

          <TextField
            fullWidth
            label="Número de teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej: 1134567890"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalleModal(false)}>Volver</Button>
          <Button variant="contained" onClick={handleConfirm} disabled={!servicio || !telefono.trim()}>
            Confirmar turno
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
