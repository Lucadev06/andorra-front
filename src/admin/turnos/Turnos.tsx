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
  Tooltip,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  TableContainer,
  TextField,
  MenuItem,
  Chip,
  Button,
  TablePagination,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { useContext, useState, useMemo } from "react";
import EditarTurnoDialog from "./EditarTurnoDialog";
import { TurnosContext, type Turno } from "../../context/TurnosContextTypes";
import { parseTurnoDate, compareTurnoDates } from "../../utils/dateUtils";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function Turnos() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const context = useContext(TurnosContext);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  
  // Estados para filtros
  const [filtroFecha, setFiltroFecha] = useState<Date | null>(null);
  const [filtroHora, setFiltroHora] = useState<string>("");
  const [filtroServicio, setFiltroServicio] = useState<string>("");

  // Estados para paginación de clientes
  const [pageClientes, setPageClientes] = useState(0);
  const [rowsPerPageClientes, setRowsPerPageClientes] = useState(5);

  // Estados para paginación de turnos
  const [pageTurnos, setPageTurnos] = useState(0);
  const [rowsPerPageTurnos, setRowsPerPageTurnos] = useState(10);

  if (!context) {
    return <p>Cargando...</p>;
  }

  const { turnos, updateTurno, deleteTurno } = context;

  const uniqueClients = [...new Map(turnos.map(turno => [turno.mail, turno])).values()];

  // Obtener servicios únicos para el filtro
  const serviciosUnicos = useMemo(() => {
    const servicios = turnos
      .map(t => t.servicio)
      .filter((s): s is string => !!s && s.trim() !== "");
    return [...new Set(servicios)].sort();
  }, [turnos]);

  // Obtener horarios únicos para el filtro
  const horariosUnicos = useMemo(() => {
    const horarios = turnos
      .map(t => t.hora)
      .filter((h): h is string => !!h);
    return [...new Set(horarios)].sort();
  }, [turnos]);

  // Filtrar turnos
  const turnosFiltrados = useMemo(() => {
    return turnos.filter(t => {
      // Filtro por fecha
      if (filtroFecha) {
        const fechaTurno = parseTurnoDate(t.fecha);
        if (!fechaTurno) return false;
        const fechaFiltroStr = filtroFecha.toISOString().split("T")[0];
        const fechaTurnoStr = fechaTurno.toISOString().split("T")[0];
        if (fechaFiltroStr !== fechaTurnoStr) return false;
      }

      // Filtro por horario
      if (filtroHora && t.hora !== filtroHora) return false;

      // Filtro por servicio
      if (filtroServicio && t.servicio !== filtroServicio) return false;

      return true;
    });
  }, [turnos, filtroFecha, filtroHora, filtroServicio]);

  const limpiarFiltros = () => {
    setFiltroFecha(null);
    setFiltroHora("");
    setFiltroServicio("");
    setPageTurnos(0); // Resetear paginación al limpiar filtros
  };

  const tieneFiltrosActivos = filtroFecha || filtroHora || filtroServicio;

  // Paginación de clientes
  const clientesPaginados = useMemo(() => {
    const start = pageClientes * rowsPerPageClientes;
    const end = start + rowsPerPageClientes;
    return uniqueClients.slice(start, end);
  }, [uniqueClients, pageClientes, rowsPerPageClientes]);

  // Paginación de turnos
  const turnosOrdenados = useMemo(() => {
    return [...turnosFiltrados].sort((a, b) => compareTurnoDates(a.fecha, b.fecha));
  }, [turnosFiltrados]);

  const turnosPaginados = useMemo(() => {
    const start = pageTurnos * rowsPerPageTurnos;
    const end = start + rowsPerPageTurnos;
    return turnosOrdenados.slice(start, end);
  }, [turnosOrdenados, pageTurnos, rowsPerPageTurnos]);

  const handleChangePageClientes = (_event: unknown, newPage: number) => {
    setPageClientes(newPage);
  };

  const handleChangeRowsPerPageClientes = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageClientes(parseInt(event.target.value, 10));
    setPageClientes(0);
  };

  const handleChangePageTurnos = (_event: unknown, newPage: number) => {
    setPageTurnos(newPage);
  };

  const handleChangeRowsPerPageTurnos = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPageTurnos(parseInt(event.target.value, 10));
    setPageTurnos(0);
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
      {/* Clientes Registrados */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Clientes Registrados
            </Typography>
            <Chip
              label={`${uniqueClients.length} ${uniqueClients.length === 1 ? 'cliente' : 'clientes'}`}
              color="primary"
              size="small"
            />
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uniqueClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No hay clientes registrados
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientesPaginados.map(client => (
                    <TableRow key={client.mail} hover>
                      <TableCell>{client.cliente}</TableCell>
                      <TableCell>{client.mail}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {uniqueClients.length > 0 && (
            <TablePagination
              component="div"
              count={uniqueClients.length}
              page={pageClientes}
              onPageChange={handleChangePageClientes}
              rowsPerPage={rowsPerPageClientes}
              onRowsPerPageChange={handleChangeRowsPerPageClientes}
              rowsPerPageOptions={[5, 10, 25]}
              labelRowsPerPage="Clientes por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Turnos */}
      <Card elevation={2}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Turnos
            </Typography>
            {tieneFiltrosActivos && (
              <Chip
                label={`${turnosFiltrados.length} de ${turnos.length} turnos`}
                color="primary"
                size="small"
              />
            )}
          </Box>

          {/* Filtros */}
          <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: theme.palette.grey[50] }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterListIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Filtros
              </Typography>
              {tieneFiltrosActivos && (
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={limpiarFiltros}
                  sx={{ ml: 'auto' }}
                >
                  Limpiar filtros
                </Button>
              )}
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <Box>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                  <DatePicker
                    label="Filtrar por fecha"
                    value={filtroFecha}
                    onChange={(newValue) => setFiltroFecha(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>
              <Box>
                <TextField
                  select
                  label="Filtrar por horario"
                  value={filtroHora}
                  onChange={(e) => setFiltroHora(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">
                    <em>Todos los horarios</em>
                  </MenuItem>
                  {horariosUnicos.map((hora) => (
                    <MenuItem key={hora} value={hora}>
                      {hora}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <Box>
                <TextField
                  select
                  label="Filtrar por servicio"
                  value={filtroServicio}
                  onChange={(e) => setFiltroServicio(e.target.value)}
                  fullWidth
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  SelectProps={{
                    displayEmpty: true,
                  }}
                >
                  <MenuItem value="">
                    <em>Todos los servicios</em>
                  </MenuItem>
                  {serviciosUnicos.map((servicio) => (
                    <MenuItem key={servicio} value={servicio}>
                      {servicio}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
          </Paper>
          {isMobile ? (
            // Vista móvil: cards
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {turnosFiltrados.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {tieneFiltrosActivos ? "No hay turnos que coincidan con los filtros" : "No hay turnos registrados"}
                </Typography>
              ) : (
                turnosPaginados.map((t) => {
                    const adjustedDate = parseTurnoDate(t.fecha);

                    return (
                      <Paper key={t._id} elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {t.cliente}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t.mail}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              color="primary"
                              onClick={() => setTurnoSeleccionado(t)}
                              size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={async () => {
                                if (window.confirm(`¿Estás seguro de eliminar el turno de ${t.cliente}?`)) {
                                  try {
                                    await deleteTurno(t._id);
                                    alert("✅ Turno eliminado con éxito");
                                  } catch (error) {
                                    alert("❌ Error al eliminar el turno");
                                  }
                                }
                              }}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 1.5 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Servicio:</strong> {t.servicio || "-"}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Fecha:</strong>{" "}
                            {adjustedDate
                              ? format(adjustedDate, "d 'de' MMMM yyyy", { locale: es })
                              : "-"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Hora:</strong> {t.hora}
                          </Typography>
                        </Box>
                      </Paper>
                    );
                  })
              )}
            </Box>
          ) : (
            // Vista desktop: tabla
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Servicio</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Hora</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {turnosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          {tieneFiltrosActivos ? "No hay turnos que coincidan con los filtros" : "No hay turnos registrados"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    turnosPaginados.map((t) => {
                        const adjustedDate = parseTurnoDate(t.fecha);
                        if (!adjustedDate) return null;

                        const formattedDate = format(adjustedDate, "dd/MM/yyyy");
                        const descriptiveDate = format(adjustedDate, "d 'de' MMMM yyyy", { locale: es });

                        return (
                          <TableRow key={t._id} hover>
                            <TableCell>{t.cliente}</TableCell>
                            <TableCell>{t.servicio || "-"}</TableCell>
                            <TableCell>
                              <Tooltip title={descriptiveDate}>
                                <span>{formattedDate}</span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>{t.hora}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <IconButton
                                  color="primary"
                                  onClick={() => setTurnoSeleccionado(t)}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={async () => {
                                    if (window.confirm(`¿Estás seguro de eliminar el turno de ${t.cliente}?`)) {
                                      try {
                                        await deleteTurno(t._id);
                                        alert("✅ Turno eliminado con éxito");
                                      } catch (error) {
                                        alert("❌ Error al eliminar el turno");
                                      }
                                    }
                                  }}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {turnosFiltrados.length > 0 && (
            <TablePagination
              component="div"
              count={turnosFiltrados.length}
              page={pageTurnos}
              onPageChange={handleChangePageTurnos}
              rowsPerPage={rowsPerPageTurnos}
              onRowsPerPageChange={handleChangeRowsPerPageTurnos}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Turnos por página:"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
              }
            />
          )}
        </CardContent>
      </Card>

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
