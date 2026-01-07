import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../context/AuthContext";
import { parseTurnoDate } from "../utils/dateUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import EditarTurnoClienteDialog from "./EditarTurnoClienteDialog";

interface Turno {
  _id: string;
  fecha: string;
  hora: string;
  cliente: string;
  mail: string;
  servicio?: string;
}

interface MisTurnosDialogProps {
  open: boolean;
  onClose: () => void;
  onTurnoCambiado?: () => void; // Callback para notificar cambios
}

export default function MisTurnosDialog({ open, onClose, onTurnoCambiado }: MisTurnosDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [error, setError] = useState("");
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [turnoEditando, setTurnoEditando] = useState<Turno | null>(null);

  const API_URL = "https://andorra-back-1.onrender.com/api";

  const handleSearch = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      setTurnos([]);
      setSearched(true);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/turnos/email/${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setTurnos(data.data);
      } else {
        setTurnos([]);
      }
    } catch (error) {
      console.error("Error fetching turnos:", error);
      setTurnos([]);
    }
    setSearched(true);
    setIsLoading(false);
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    if (open && isAuthenticated && user?.email) {
      void handleSearch();
    } else if (open && !isAuthenticated) {
      setSearched(true);
      setTurnos([]);
    }
  }, [open, isAuthenticated, user?.email, handleSearch]);

  const handleClose = () => {
    setTurnos([]);
    setSearched(false);
    setTab(0);
    setError("");
    onClose();
  };

  // Función para verificar si se puede cancelar (validación en frontend para mejor UX)
  const puedeCancelar = (turno: Turno): { puede: boolean; razon?: string } => {
    const fechaTurno = parseTurnoDate(turno.fecha);
    if (!fechaTurno) return { puede: false, razon: "Fecha inválida" };

    const [hora, minuto] = turno.hora.split(":").map(Number);
    const fechaHoraTurno = new Date(fechaTurno);
    fechaHoraTurno.setHours(hora, minuto, 0, 0);

    const ahora = new Date();
    const diferenciaMs = fechaHoraTurno.getTime() - ahora.getTime();
    const diferenciaHoras = diferenciaMs / (1000 * 60 * 60);

    if (diferenciaHoras <= 6) {
      const horasRestantes = Math.max(0, Math.round(diferenciaHoras * 10) / 10);
      return { 
        puede: false, 
        razon: `No se puede cancelar. Debe cancelarse con más de 6 horas de anticipación. Faltan ${horasRestantes} horas.` 
      };
    }

    return { puede: true };
  };

  const handleCancelar = async (turno: Turno) => {
    const validacion = puedeCancelar(turno);
    if (!validacion.puede) {
      setError(validacion.razon || "No se puede cancelar este turno");
      return;
    }

    if (!window.confirm(`¿Estás seguro de cancelar tu turno del ${format(parseTurnoDate(turno.fecha)!, "d 'de' MMMM yyyy", { locale: es })} a las ${turno.hora}?`)) {
      return;
    }

    setCancelandoId(turno._id);
    setError("");

    try {
      const response = await fetch(`${API_URL}/turnos/cancelar/${turno._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Turno cancelado exitosamente");
        // Recargar los turnos
        await handleSearch();
        // Notificar al componente padre para actualizar el estado
        if (onTurnoCambiado) {
          onTurnoCambiado();
        }
      } else {
        setError(data.error || "Error al cancelar el turno");
      }
    } catch (err) {
      console.error("Error cancelando turno:", err);
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setCancelandoId(null);
    }
  };

  const handleTurnoEditado = async () => {
    await handleSearch();
    if (onTurnoCambiado) {
      onTurnoCambiado();
    }
  };

  // Separar vigentes e historial
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
  const turnosVigentes = turnos.filter(t => {
    const fechaTurno = parseTurnoDate(t.fecha);
    if (!fechaTurno) return false;
    fechaTurno.setHours(0, 0, 0, 0);
    return fechaTurno >= hoy;
  });
  const turnosHistorial = turnos.filter(t => {
    const fechaTurno = parseTurnoDate(t.fecha);
    if (!fechaTurno) return false;
    fechaTurno.setHours(0, 0, 0, 0);
    return fechaTurno < hoy;
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Mis Turnos</DialogTitle>
      <DialogContent>
        {!isAuthenticated ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
            Inicia sesión con Google para ver tus turnos.
          </Typography>
        ) : (
          <>
            {isLoading && <CircularProgress sx={{ display: "block", margin: "20px auto" }} />}
            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}
            {searched && turnos.length > 0 && (
              <>
                <Tabs value={tab} onChange={(_, newValue) => setTab(newValue)} centered>
                  <Tab label="Vigentes" />
                  <Tab label="Historial" />
                </Tabs>

                <Box sx={{ mt: 2 }}>
                  {tab === 0 && (
                    <Paper elevation={3}>
                      <List>
                        {turnosVigentes.length > 0 ? (
                          turnosVigentes.map((turno) => {
                            const fechaTurno = parseTurnoDate(turno.fecha);
                            const validacion = puedeCancelar(turno);
                            const validacionEditar = puedeCancelar(turno); // Reutilizamos la misma función
                            return (
                              <ListItem 
                                key={turno._id} 
                                divider
                                secondaryAction={
                                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Tooltip title={validacionEditar.puede ? "Editar turno" : validacionEditar.razon || "No se puede editar"}>
                                      <span>
                                        <IconButton
                                          edge="end"
                                          color="primary"
                                          onClick={() => setTurnoEditando(turno)}
                                          disabled={!validacionEditar.puede}
                                          size="small"
                                        >
                                          <EditIcon />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title={validacion.puede ? "Cancelar turno" : validacion.razon || "No se puede cancelar"}>
                                      <span>
                                        <IconButton
                                          edge="end"
                                          color="error"
                                          onClick={() => handleCancelar(turno)}
                                          disabled={!validacion.puede || cancelandoId === turno._id}
                                          size="small"
                                        >
                                          <CancelIcon />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </Box>
                                }
                              >
                                <ListItemText
                                  primary={`${fechaTurno ? format(fechaTurno, "d 'de' MMMM yyyy", { locale: es }) : turno.fecha} - ${turno.hora}`}
                                  secondary={
                                    <>
                                      <Typography component="span" variant="body2">
                                        Servicio: {turno.servicio || "No especificado"}
                                      </Typography>
                                      {!validacion.puede && validacion.razon && (
                                        <Typography component="div" variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                                          {validacion.razon}
                                        </Typography>
                                      )}
                                    </>
                                  }
                                />
                              </ListItem>
                            );
                          })
                        ) : (
                          <Typography sx={{ p: 2 }}>No tienes turnos vigentes.</Typography>
                        )}
                      </List>
                    </Paper>
                  )}

                  {tab === 1 && (
                    <Paper elevation={3}>
                      <List>
                        {turnosHistorial.length > 0 ? (
                          turnosHistorial.map((turno) => {
                            const fechaTurno = parseTurnoDate(turno.fecha);
                            return (
                              <ListItem key={turno._id} divider>
                                <ListItemText
                                  primary={`${fechaTurno ? format(fechaTurno, "d 'de' MMMM yyyy", { locale: es }) : turno.fecha} - ${turno.hora}`}
                                  secondary={`Servicio: ${turno.servicio || "No especificado"}`}
                                />
                              </ListItem>
                            );
                          })
                        ) : (
                          <Typography sx={{ p: 2 }}>No tienes turnos en historial.</Typography>
                        )}
                      </List>
                    </Paper>
                  )}
                </Box>
              </>
            )}

            {searched && turnos.length === 0 && !isLoading && (
              <Typography sx={{ mt: 2 }}>No se encontraron turnos para tu email.</Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>

      {turnoEditando && (
        <EditarTurnoClienteDialog
          open={!!turnoEditando}
          onClose={() => setTurnoEditando(null)}
          turno={turnoEditando}
          onUpdated={handleTurnoEditado}
        />
      )}
    </Dialog>
  );
}
