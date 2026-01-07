import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { useState } from "react";
import LockIcon from "@mui/icons-material/Lock";

interface AdminPasswordDialogProps {
  open: boolean;
  onSuccess: () => void;
}

// Contraseña de admin (cambiar aquí si es necesario)
const ADMIN_PASSWORD = "1234";

export default function AdminPasswordDialog({
  open,
  onSuccess,
}: AdminPasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === ADMIN_PASSWORD) {
      // Guardar sesión de admin en localStorage
      localStorage.setItem("adminAuthenticated", "true");
      localStorage.setItem("adminSessionExpiry", String(Date.now() + 8 * 60 * 60 * 1000)); // 8 horas
      onSuccess();
      setPassword("");
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleClose = () => {
    // No permitir cerrar sin autenticarse
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LockIcon color="primary" />
            <Typography variant="h6">Acceso Administrativo</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ingresá la contraseña para acceder al panel de administración.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            disabled={!password.trim()}
            fullWidth
            sx={{ mb: 1 }}
          >
            Ingresar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

