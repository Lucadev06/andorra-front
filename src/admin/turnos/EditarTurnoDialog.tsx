"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface Peluquero {
  _id: string;
  nombre: string;
}

interface Turno {
  _id: string;
  peluquero: string | { _id: string; nombre: string };
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

interface TurnoConPeluqueroId extends Turno {
  peluqueroId: string;
}

interface EditarTurnoDialogProps {
  open: boolean;
  onClose: () => void;
  turno: Turno;
  onUpdated: (turnoEditado: Turno) => void; // 👈 ahora coincide
}

export function EditarTurnoDialog({
  open,
  onClose,
  turno,
  onUpdated,
}: EditarTurnoDialogProps) {
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [peluqueroSeleccionado, setPeluqueroSeleccionado] = useState("");
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [servicio, setServicio] = useState("");
  const [initialTurno, setInitialTurno] = useState<TurnoConPeluqueroId | null>(
    null
  );
  const [hasChanged, setHasChanged] = useState(false);

  const API_URL = "https://andorra-back-1.onrender.com/api";

  useEffect(() => {
    const fetchPeluqueros = async () => {
      try {
        const res = await fetch(`${API_URL}/peluqueros`);
        const data = (await res.json()) as Peluquero[];
        setPeluqueros(data);
      } catch (err) {
        console.error("Error obteniendo peluqueros:", err);
      }
    };
    void fetchPeluqueros();
  }, []);

  useEffect(() => {
    if (turno) {
      const initial: TurnoConPeluqueroId = {
        ...turno,
        peluqueroId:
          typeof turno.peluquero === "string"
            ? turno.peluquero
            : turno.peluquero?._id || "",
      };
      setInitialTurno(initial);
      setPeluqueroSeleccionado(initial.peluqueroId);
      setCliente(turno.cliente || "");
      setFecha(format(new Date(turno.fecha), "yyyy-MM-dd") || "");
      setHora(turno.hora || "");
      setServicio(turno.servicio || "");
      setHasChanged(false);
    }
  }, [turno]);

  useEffect(() => {
    if (!initialTurno) return;

    const changes =
      initialTurno.peluqueroId !== peluqueroSeleccionado ||
      initialTurno.cliente !== cliente ||
      initialTurno.fecha !== fecha ||
      initialTurno.hora !== hora ||
      initialTurno.servicio !== servicio;

    setHasChanged(changes);
  }, [
    peluqueroSeleccionado,
    cliente,
    fecha,
    hora,
    servicio,
    initialTurno,
  ]);

  async function handleSave() {
    if (!peluqueroSeleccionado || !cliente || !fecha || !hora) {
      alert("Todos los campos son obligatorios");
      return;
    }

    const peluqueroCompleto = peluqueros.find(
      (p) => p._id === peluqueroSeleccionado
    );

    const turnoActualizado = {
      ...turno,
      peluquero: peluqueroCompleto || turno.peluquero,
      cliente,
      fecha: new Date(fecha).toISOString(),
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>✏️ Editar turno</DialogTitle>
      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
      >
        <TextField
          select
          label="Peluquero"
          value={peluqueroSeleccionado}
          onChange={(e) => setPeluqueroSeleccionado(e.target.value)}
        >
          {peluqueros.map((p) => (
            <MenuItem key={p._id} value={p._id}>
              {p.nombre}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Cliente"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
        />

        <TextField
          label="Servicio"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
        />

        <TextField
          type="date"
          label="Fecha"
          value={fecha}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setFecha(e.target.value)}
        />

        <TextField
          type="time"
          label="Hora"
          value={hora}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setHora(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={!hasChanged}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
