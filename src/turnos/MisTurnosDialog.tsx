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
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

interface Turno {
  _id: string;
  fecha: string;
  hora: string;
  peluquero: {
    nombre: string;
  };
  servicio: string;
}

interface MisTurnosDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function MisTurnosDialog({ open, onClose }: MisTurnosDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tab, setTab] = useState(0);

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
    onClose();
  };

  // Separar vigentes e historial
  const hoy = new Date();
  const turnosVigentes = turnos.filter(t => new Date(t.fecha) >= hoy);
  const turnosHistorial = turnos.filter(t => new Date(t.fecha) < hoy);

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
                          turnosVigentes.map((turno) => (
                            <ListItem key={turno._id} divider>
                              <ListItemText
                                primary={`${new Date(turno.fecha).toLocaleDateString()} - ${turno.hora}`}
                                secondary={`Barbero: ${turno.peluquero.nombre} - Servicio: ${turno.servicio}`}
                              />
                            </ListItem>
                          ))
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
                          turnosHistorial.map((turno) => (
                            <ListItem key={turno._id} divider>
                              <ListItemText
                                primary={`${new Date(turno.fecha).toLocaleDateString()} - ${turno.hora}`}
                                secondary={`Barbero: ${turno.peluquero.nombre} - Servicio: ${turno.servicio}`}
                              />
                            </ListItem>
                          ))
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
    </Dialog>
  );
}
