
import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
} from "@mui/material";

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
  const [email, setEmail] = useState("");
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [searched, setSearched] = useState(false);

  const API_URL = "https://andorra-back-1.onrender.com/api";

  const handleSearch = async () => {
    if (!email) {
      alert("Por favor, ingresa tu email.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/turnos/email/${email}`);
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
  };

  const handleClose = () => {
    setEmail("");
    setTurnos([]);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Mis Turnos</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 2, mt: 2, mb: 4 }}>
          <TextField
            label="Ingresá tu email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button variant="contained" onClick={handleSearch}>
            Buscar
          </Button>
        </Box>

        {searched && turnos.length > 0 && (
          <Paper elevation={3}>
            <List>
              {turnos.map((turno) => (
                <ListItem key={turno._id} divider>
                  <ListItemText
                    primary={`${new Date(turno.fecha).toLocaleDateString()} - ${turno.hora}`}
                    secondary={`Barbero: ${turno.peluquero.nombre} - Servicio: ${turno.servicio}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {searched && turnos.length === 0 && (
          <Typography>No se encontraron turnos para el email ingresado.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
