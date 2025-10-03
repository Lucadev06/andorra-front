"use client";
import { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Turno {
  _id: string;
  peluquero: { _id: string; nombre: string } | string;
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

interface DataPorPeluquero {
  [key: string]: string | number; // 👈 index signature
  nombre: string;
  total: number;
}


const COLORS = ["#f2a900", "#8884d8", "#82ca9d", "#ffc658"];

export default function Dashboard() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [dataPorPeluquero, setDataPorPeluquero] = useState<DataPorPeluquero[]>(
    []
  );
  const [totalPeluqueros, setTotalPeluqueros] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);

  const API_URL = "https://andorra-back-1.onrender.com/api";

  useEffect(() => {
    fetch(`${API_URL}/turnos`)
      .then((res) => res.json())
      .then((data) => {
        const turnosData: Turno[] = data.data || [];
        setTurnos(turnosData);

        // --- Agrupamos por peluquero (ignorar "Desconocido")
        const conteoPorPeluquero: Record<string, number> = {};
        const clientesSet = new Set<string>();
        turnosData.forEach((t) => {
          const nombre =
            typeof t.peluquero === "string"
              ? t.peluquero
              : t.peluquero?.nombre || "";
          if (nombre && nombre.toLowerCase() !== "desconocido") {
            conteoPorPeluquero[nombre] =
              (conteoPorPeluquero[nombre] || 0) + 1;
          }
          if (t.cliente) clientesSet.add(t.cliente);
        });

        setDataPorPeluquero(
          Object.entries(conteoPorPeluquero).map(([nombre, total]) => ({
            nombre,
            total,
          }))
        );

        setTotalPeluqueros(Object.keys(conteoPorPeluquero).length);
        setTotalClientes(clientesSet.size);
      })
      .catch((err) => console.error("Error cargando turnos:", err));
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        
      }}
    >
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* --- Tarjetas resumen --- */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))"
        gap={2}
        mb={3}
      >
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="subtitle1">Peluqueros</Typography>
          <Typography variant="h5">{totalPeluqueros}</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="subtitle1">Clientes</Typography>
          <Typography variant="h5">{totalClientes}</Typography>
        </Paper>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="subtitle1">Turnos</Typography>
          <Typography variant="h5">{turnos.length}</Typography>
        </Paper>
      </Box>

      {/* --- Gráfico de turnos por peluquero --- */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Turnos por peluquero
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataPorPeluquero}
              dataKey="total"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {dataPorPeluquero.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
