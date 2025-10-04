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
import EditIcon from "@mui/icons-material/Edit";
import { useContext, useState } from "react";
import { EditarTurnoDialog } from "./EditarTurnoDialog";
import { TurnosContext } from "../../context/TurnosContextTypes";

interface Turno {
  _id: string;
  peluquero: string | { _id: string; nombre: string };
  cliente: string;
  fecha: string; // viene como "2025-10-06T00:00:00.000Z"
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
              .sort((a, b) => {
                const dateA = new Date(a.fecha).getTime();
                const dateB = new Date(b.fecha).getTime();
                if (isNaN(dateA) && isNaN(dateB)) return 0;
                if (isNaN(dateA)) return 1;
                if (isNaN(dateB)) return -1;
                return dateA - dateB;
              })
              .map((t) => (
                <TableRow key={t._id}>
                  <TableCell>
                    {typeof t.peluquero === "string"
                      ? t.peluquero
                      : t.peluquero?.nombre}
                  </TableCell>
                  <TableCell>{t.cliente}</TableCell>
                  <TableCell>{t.servicio || "-"}</TableCell>
                  <TableCell>
                    {/* mostramos yyyy-MM-dd cortando el ISO */}
                    {t.fecha ? t.fecha.substring(0, 10) : "-"}
                  </TableCell>
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
