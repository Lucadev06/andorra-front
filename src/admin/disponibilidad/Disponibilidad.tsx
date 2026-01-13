import { useContext, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Chip, 
  IconButton,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { DisponibilidadContext } from '../../context/DisponibilidadContext';
import { TurnosContext } from '../../context/TurnosContextTypes';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { parseTurnoDate } from '../../utils/dateUtils';

const generarHorarios = (inicio: string, fin: string, intervalo: number) => {
  const horarios = [];
  let [hora, minuto] = inicio.split(":").map(Number);

  while (true) {
    const horarioActual = `${String(hora).padStart(2, "0")}:${String(
      minuto
    ).padStart(2, "0")}`;
    if (horarioActual >= fin) break;
    horarios.push(horarioActual);

    minuto += intervalo;
    if (minuto >= 60) {
      hora += Math.floor(minuto / 60);
      minuto %= 60;
    }
  }
  return horarios;
};

// Función helper para parsear fecha sin problemas de zona horaria
const parseDateString = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  // Verificar que la fecha es válida
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
};

const getUtcDateString = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return d.toISOString().split("T")[0];
};

const todosLosHorarios = generarHorarios("10:00", "20:00", 30);

// Función para verificar si es domingo
const isDomingo = (date: Date) => {
  return date.getDay() === 0; // 0 es Domingo
};

const Disponibilidad = () => {
  const theme = useTheme();
  const context = useContext(DisponibilidadContext);
  const turnosContext = useContext(TurnosContext);
  const [fecha, setFecha] = useState<Date | null>(new Date());

  if (!context || !turnosContext) {
    return <p>Cargando...</p>;
  }

  const { diasNoDisponibles, addDiaNoDisponible, deleteDiaNoDisponible } = context;
  const { turnos } = turnosContext;

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      // Validar que no sea domingo
      if (isDomingo(value)) {
        alert("Los domingos no están disponibles para bloquear horarios.");
        return;
      }
      setFecha(value);
    }
  };

  // Función para deshabilitar fechas en el calendario
  const tileDisabled = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      // Deshabilitar domingos
      if (isDomingo(date)) {
        return true;
      }
      // Deshabilitar días anteriores
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const fechaSeleccionada = new Date(date);
      fechaSeleccionada.setHours(0, 0, 0, 0);
      if (fechaSeleccionada < hoy) {
        return true;
      }
    }
    return false;
  };

  const handleBlockDay = () => {
    if (fecha) {
      // Validar que no sea domingo
      if (isDomingo(fecha)) {
        alert("Los domingos no están disponibles para bloquear.");
        return;
      }
      // Enviar todos los horarios bloqueados en lugar de [] vacío
      // Esto permite desbloquear horarios individuales después
      addDiaNoDisponible(getUtcDateString(fecha), todosLosHorarios);
    }
  };

  const handleBlockTime = (horario: string) => {
    if (fecha) {
      // Validar que no sea domingo
      if (isDomingo(fecha)) {
        alert("Los domingos no están disponibles para bloquear.");
        return;
      }
      addDiaNoDisponible(getUtcDateString(fecha), [horario]);
    }
  };
  
  const handleDeleteBlock = async (fecha: string, horario?: string) => {
    try {
      await deleteDiaNoDisponible(fecha, horario);
      // Esperar un momento para que el contexto se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      // Forzar re-render actualizando la fecha
      if (fecha && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fecha.split('-').map(Number);
        setFecha(new Date(year, month - 1, day));
      }
    } catch (error) {
      console.error('Error desbloqueando:', error);
    }
  };

  const tileClassName = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      // Si es domingo, aplicar estilo de deshabilitado
      if (isDomingo(date)) {
        return 'disabled-day';
      }
      const dateString = getUtcDateString(date);
      const dia = diasNoDisponibles.find(d => {
        // Normalizar ambas fechas para comparar
        const diaFecha = typeof d.fecha === 'string' ? d.fecha : getUtcDateString(new Date(d.fecha));
        return diaFecha === dateString;
      });
      if (dia) {
        const horarios = Array.isArray(dia.horarios) ? dia.horarios : [];
        // Si tiene todos los horarios bloqueados, es día completo bloqueado
        if (horarios.length === todosLosHorarios.length) {
          return 'blocked-day';
        }
        // Si tiene algunos horarios bloqueados, es parcialmente bloqueado
        if (horarios.length > 0) {
          return 'partially-blocked-day';
        }
      }
    }
    return null;
  };

  const selectedDateString = fecha ? getUtcDateString(fecha) : '';
  const selectedDayInfo = diasNoDisponibles.find(d => {
    // Normalizar ambas fechas para comparar
    const diaFecha = typeof d.fecha === 'string' ? d.fecha : getUtcDateString(new Date(d.fecha));
    return diaFecha === selectedDateString;
  });
  const blockedHours = selectedDayInfo && Array.isArray(selectedDayInfo.horarios) 
    ? selectedDayInfo.horarios 
    : [];
  // Un día está completamente bloqueado si tiene todos los horarios bloqueados
  const isDayFullyBlocked = selectedDayInfo && blockedHours.length === todosLosHorarios.length;

  // Obtener los horarios ocupados por turnos de clientes para la fecha seleccionada
  const turnosOcupados = turnos
    .filter(t => {
      const fechaTurno = parseTurnoDate(t.fecha);
      if (!fechaTurno) return false;
      const fechaTurnoISO = fechaTurno.toISOString().split("T")[0];
      return fechaTurnoISO === selectedDateString;
    })
    .map(t => t.hora);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '1400px', mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3,
          fontWeight: 600,
          color: theme.palette.text.primary
        }}
      >
        Gestionar Disponibilidad
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' }, gap: 3 }}>
        {/* Calendario */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventBusyIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" fontWeight={600}>
                  Calendario
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Calendar
                  onChange={handleDateChange}
                  value={fecha}
                  locale="es"
                  tileClassName={tileClassName}
                  tileDisabled={tileDisabled}
                  className="custom-calendar"
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                Los domingos y días anteriores no están disponibles
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                startIcon={<BlockIcon />}
                onClick={handleBlockDay}
                sx={{ 
                  mt: 2,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Bloquear día completo
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Horarios del día seleccionado */}
        {fecha && !isNaN(fecha.getTime()) && (
          <Box>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  <Typography variant="h6" fontWeight={600}>
                    Horarios para el {format(fecha, 'd \'de\' MMMM yyyy', { locale: es })}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
                  {todosLosHorarios.map(horario => {
                    const isBlocked = blockedHours.includes(horario);
                    const isOcupado = turnosOcupados.includes(horario);
                    return (
                      <Box key={horario}>
                        <Paper
                          elevation={isBlocked || isDayFullyBlocked || isOcupado ? 3 : 1}
                          sx={{
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: isOcupado
                              ? `${theme.palette.success.main}20`
                              : isBlocked || isDayFullyBlocked 
                              ? `${theme.palette.error.main}20` 
                              : theme.palette.background.paper,
                            border: `2px solid ${
                              isOcupado 
                                ? theme.palette.success.main 
                                : isBlocked || isDayFullyBlocked 
                                ? theme.palette.error.main 
                                : theme.palette.divider
                            }`,
                            borderRadius: 1,
                            transition: 'all 0.2s',
                            opacity: isDayFullyBlocked ? 0.7 : 1,
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <AccessTimeIcon 
                              sx={{ 
                                fontSize: '1.3rem',
                                color: isOcupado
                                  ? theme.palette.success.main
                                  : isBlocked || isDayFullyBlocked 
                                  ? theme.palette.error.main 
                                  : theme.palette.text.secondary
                              }} 
                            />
                            <Typography 
                              variant="body1" 
                              fontWeight={700}
                              sx={{ 
                                color: isOcupado
                                  ? theme.palette.success.main
                                  : isBlocked || isDayFullyBlocked 
                                  ? theme.palette.error.main 
                                  : theme.palette.text.primary,
                                fontSize: '1.1rem'
                              }}
                            >
                              {horario}
                            </Typography>
                            {isOcupado ? (
                              <Chip 
                                label="Ocupado" 
                                size="small" 
                                color="success"
                                sx={{ 
                                  ml: 1, 
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              />
                            ) : (isBlocked || isDayFullyBlocked) && (
                              <Chip 
                                label={isDayFullyBlocked ? "Día bloqueado" : "Bloqueado"} 
                                size="small" 
                                color="error"
                                sx={{ 
                                  ml: 1, 
                                  fontWeight: 700,
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </Box>
                          {isOcupado ? (
                            <Chip 
                              label="No disponible" 
                              size="small" 
                              disabled
                              sx={{
                                fontWeight: 600,
                                minWidth: '120px'
                              }}
                            />
                          ) : isDayFullyBlocked ? (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={() => handleDeleteBlock(selectedDateString, horario)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                minWidth: '120px'
                              }}
                            >
                              Desbloquear
                            </Button>
                          ) : isBlocked ? (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteBlock(selectedDateString, horario)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                minWidth: '120px'
                              }}
                            >
                              Desbloquear
                            </Button>
                          ) : (
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleBlockTime(horario)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                minWidth: '100px'
                              }}
                            >
                              Bloquear
                            </Button>
                          )}
                        </Paper>
                      </Box>
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Días bloqueados */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventBusyIcon sx={{ mr: 1, color: theme.palette.error.main }} />
                <Typography variant="h6" fontWeight={600}>
                  Días Bloqueados
                </Typography>
                <Chip 
                  label={`${diasNoDisponibles.length} ${diasNoDisponibles.length === 1 ? 'día' : 'días'}`}
                  size="small"
                  color="primary"
                  sx={{ ml: 2, fontWeight: 600 }}
                />
              </Box>
              <Divider sx={{ mb: 2 }} />
              {diasNoDisponibles.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No hay días bloqueados
                </Typography>
              ) : (
                <Box>
                  {diasNoDisponibles
                    .filter(dia => {
                      // Filtrar días que tengan al menos un horario bloqueado
                      const horariosArray = Array.isArray(dia.horarios) ? dia.horarios : [];
                      return horariosArray.length > 0;
                    })
                    .sort((a, b) => {
                      const fechaA = parseDateString(a.fecha);
                      const fechaB = parseDateString(b.fecha);
                      if (!fechaA || !fechaB) return 0;
                      return fechaA.getTime() - fechaB.getTime();
                    })
                    .map(dia => {
                      const fechaParsed = parseDateString(dia.fecha);
                      if (!fechaParsed) {
                        return null; // Omitir fechas inválidas
                      }
                      const diaSemana = format(fechaParsed, 'EEEE', { locale: es });
                      const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                      const horariosArray = Array.isArray(dia.horarios) ? dia.horarios : [];
                      // Un día está completamente bloqueado si tiene todos los horarios bloqueados
                      const esDiaCompleto = horariosArray.length === todosLosHorarios.length;
                      
                      return (
                        <Paper 
                          key={dia._id || dia.fecha}
                          elevation={2}
                          sx={{ 
                            p: 2.5,
                            mb: 2.5,
                            border: `2px solid ${esDiaCompleto ? theme.palette.error.main : theme.palette.warning.main}`,
                            borderRadius: 2,
                            backgroundColor: esDiaCompleto 
                              ? `${theme.palette.error.light}15` 
                              : `${theme.palette.warning.light}15`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-2px)'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600 }}>
                                {diaSemanaCapitalizado}
                              </Typography>
                              <Typography variant="h5" fontWeight={700}>
                                {format(fechaParsed, 'd \'de\' MMMM yyyy', { locale: es })}
                              </Typography>
                            </Box>
                            <IconButton 
                              size="medium" 
                              color="error"
                              onClick={() => handleDeleteBlock(dia.fecha)}
                              sx={{ 
                                ml: 2,
                                '&:hover': {
                                  backgroundColor: `${theme.palette.error.main}20`
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          {esDiaCompleto ? (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1.5,
                              p: 1.5,
                              backgroundColor: `${theme.palette.error.light}20`,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.error.main}`
                            }}>
                              <BlockIcon sx={{ color: theme.palette.error.main, fontSize: '1.5rem' }} />
                              <Typography variant="body1" fontWeight={700} color="error" sx={{ fontSize: '1.1rem' }}>
                                Día completo bloqueado - Todos los horarios están bloqueados
                              </Typography>
                            </Box>
                          ) : (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <AccessTimeIcon sx={{ color: theme.palette.warning.main, fontSize: '1.5rem' }} />
                                <Typography variant="h6" fontWeight={700} color="warning.main">
                                  Horarios bloqueados: {horariosArray.length}
                                </Typography>
                              </Box>
                              {horariosArray.length > 0 ? (
                                <Box sx={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: 1.5,
                                  p: 2,
                                  backgroundColor: `${theme.palette.warning.light}25`,
                                  borderRadius: 1,
                                  border: `2px solid ${theme.palette.warning.main}`,
                                  minHeight: '70px'
                                }}>
                                  {[...horariosArray].sort().map((horario, index) => (
                                    <Chip
                                      key={`${dia.fecha}-${horario}-${index}`}
                                      label={horario}
                                      size="medium"
                                      color="warning"
                                      variant="filled"
                                      icon={<AccessTimeIcon sx={{ fontSize: '1.1rem' }} />}
                                      sx={{ 
                                        fontWeight: 700,
                                        fontSize: '1.05rem',
                                        height: '42px',
                                        px: 1.5,
                                        '& .MuiChip-label': {
                                          fontSize: '1.05rem',
                                          px: 1
                                        }
                                      }}
                                    />
                                  ))}
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', p: 2 }}>
                                  No hay horarios bloqueados específicos
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      );
                    })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      <style>{`
        .custom-calendar {
          width: 100% !important;
          border: none !important;
          font-family: ${theme.typography.fontFamily} !important;
        }
        .custom-calendar .react-calendar__tile {
          padding: 12px !important;
          font-size: 0.9rem !important;
        }
        .custom-calendar .react-calendar__tile--active {
          background: ${theme.palette.primary.main} !important;
          color: white !important;
        }
        .custom-calendar .react-calendar__tile--now {
          background: ${theme.palette.action.selected} !important;
        }
        .blocked-day {
          background-color: ${theme.palette.error.main} !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .partially-blocked-day {
          background-color: ${theme.palette.warning.main} !important;
          color: white !important;
          font-weight: 600 !important;
        }
        .blocked-day:hover,
        .partially-blocked-day:hover {
          opacity: 0.8;
        }
        .disabled-day {
          background-color: ${theme.palette.action.disabledBackground} !important;
          color: ${theme.palette.action.disabled} !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
        .custom-calendar .react-calendar__tile:disabled {
          background-color: ${theme.palette.action.disabledBackground} !important;
          color: ${theme.palette.action.disabled} !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }
        @media (max-width: 768px) {
          .custom-calendar .react-calendar__tile {
            padding: 8px !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </Box>
  );
};

export default Disponibilidad;
