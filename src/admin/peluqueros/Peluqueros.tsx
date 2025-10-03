import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useEffect, useState } from "react";
import { type Peluquero, getPeluqueros } from "../../services/peluqueros.services";

function Peluqueros() {
  const [peluqueros, setPeluqueros] = useState<Peluquero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeluqueros = async () => {
      try {
        const data = await getPeluqueros();
        setPeluqueros(data);
      } catch (err) {
        setError("Error al cargar los peluqueros");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPeluqueros();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Peluqueros
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peluqueros.map((p) => (
              <TableRow key={p._id}>
                <TableCell>{p.nombre}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default Peluqueros;