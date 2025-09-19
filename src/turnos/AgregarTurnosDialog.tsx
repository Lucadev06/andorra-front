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
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { useEffect, useState } from "react";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import BoyIcon from "@mui/icons-material/Boy";
import { GiBeard } from "react-icons/gi";

interface AgregarTurnosDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Turno {
  Barbero: string;
  Servicio: string;
  Fecha: string;
  Hora: string;
  Cliente: string;
  Estado: string;
}

export default function AgregarTurnosDialog({ open, onClose }: AgregarTurnosDialogProps) {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [servicio, setServicio] = useState<string>("");
  const [barbero, setBarbero] = useState<string>("");
  const [fecha, setFecha] = useState<string>("");
  const [hora, setHora] = useState<string>("");

  const csvUrl =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmOwk26sXsDPi_Pt_OXq8gcemHEMjErLe1ZECrcIauu1ZEl3xJAsB9r2BsFWpXoYKPGmsUAP-Ftrf4/pub?output=csv";

  useEffect(() => {
    Papa.parse<Turno>(csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Turno>) => setTurnos(results.data),
      error: (err: Error) => console.error("Error al traer turnos:", err.message),
    });
  }, []);

  // Barberos que ofrecen el servicio elegido
  const barberosUnicos = Array.from(
    new Set(
      turnos
        .filter((t) => !servicio || t.Servicio.toLowerCase().includes(servicio))
        .map((t) => t.Barbero)
    )
  );

  const turnosFiltrados = turnos.filter(
    (t) =>
      (!servicio || t.Servicio.toLowerCase().includes(servicio)) &&
      (!barbero || t.Barbero === barbero) &&
      (!fecha || t.Fecha === fecha) &&
      t.Estado.toLowerCase() === "libre"
  );

  const horariosUnicos = Array.from(new Set(turnosFiltrados.map((t) => t.Hora)));

  const handleConfirm = () => {
    if (!servicio || !barbero || !fecha || !hora) {
      alert("Seleccioná servicio, barbero, fecha y horario antes de confirmar.");
      return;
    }
    alert(`Turno reservado: ${servicio} con ${barbero} el ${fecha} a las ${hora}`);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle sx={{ fontWeight: "bold" }}>📅 Sacar turno</DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
        {/* 1. Selección de servicio */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Seleccioná el servicio:
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(120px, 1fr))" gap={2}>
          {[
            { key: "corte", label: "Corte", icon: <ContentCutIcon /> },
            { key: "barba", label: "Barba", icon: <GiBeard size={22} /> },
            {
              key: "corte + barba",
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
                setBarbero("");
                setFecha("");
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

        {/* 2. Selección de barbero */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Seleccioná tu barbero:
        </Typography>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(140px, 1fr))" gap={2}>
          {barberosUnicos.map((b) => (
            <Paper
              key={b}
              elevation={barbero === b ? 6 : 1}
              onClick={() => {
                if (!servicio) return;
                setBarbero(b);
                setFecha("");
                setHora("");
              }}
              sx={{
                p: 2,
                textAlign: "center",
                cursor: servicio ? "pointer" : "not-allowed",
                backgroundColor: barbero === b ? "#f2a900" : "white",
                color: servicio ? (barbero === b ? "black" : "inherit") : "gray",
                borderRadius: 2,
                transition: "all 0.25s ease",
                opacity: servicio ? 1 : 0.5,
              }}
            >
              <BoyIcon sx={{ fontSize: 40 }} />
              <Typography sx={{ mt: 1, fontWeight: "bold" }}>{b}</Typography>
            </Paper>
          ))}
        </Box>

        {/* 3. Fecha */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Seleccioná la fecha:
        </Typography>
        <TextField
          type="date"
          fullWidth
          value={fecha}
          InputLabelProps={{ shrink: true }}
          disabled={!barbero}
          onChange={(e) => {
            setFecha(e.target.value);
            setHora("");
          }}
        />

        {/* 4. Horario */}
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Seleccioná un horario:
        </Typography>
        <ToggleButtonGroup
          value={hora || null}
          exclusive
          onChange={(_, value) => setHora(value)}
          sx={{ flexWrap: "wrap", gap: 1 }}
        >
          {horariosUnicos.length > 0 ? (
            horariosUnicos.map((h) => (
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
  );
}
