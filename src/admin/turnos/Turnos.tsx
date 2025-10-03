import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import { format } from "date-fns";
import EditIcon from "@mui/icons-material/Edit";
import { useContext, useState } from "react";
import { EditarTurnoDialog } from "./EditarTurnoDialog";
import { TurnosContext } from "../../context/TurnosContextTypes";

interface Turno {
  _id: string;
  peluquero: string | { _id: string; nombre: string };
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

function Turnos() {
  const context = useContext(TurnosContext);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);

  if (!context) {
    return <p>Cargando...</p>;
  }
  const { turnos, updateTurno } = context;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Turnos
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Peluquero</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Hora</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...turnos]
              .sort(
                (a, b) =>
                  new Date(`${a.fecha}T${a.hora}`).getTime() -
                  new Date(`${b.fecha}T${b.hora}`).getTime()
              )
              .map((t) => (
                <TableRow key={t._id}>
                  <TableCell>
                    {typeof t.peluquero === "string"
                      ? t.peluquero
                      : t.peluquero?.nombre}
                  </TableCell>
                  <TableCell>{t.cliente}</TableCell>
                  <TableCell>{t.servicio || "-"}</TableCell>
                  <TableCell>{format(new Date(t.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{t.hora}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={() => setTurnoSeleccionado(t)}
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      {turnoSeleccionado && (
        <EditarTurnoDialog
          open={!!turnoSeleccionado}
          onClose={() => setTurnoSeleccionado(null)}
          turno={turnoSeleccionado}
          onUpdated={async (turnoEditado) => {
            await updateTurno(turnoEditado);
          }}
        />
      )}
    </Box>
  );
}

export default Turnos;
