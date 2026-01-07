import { parseISO, isValid } from 'date-fns';

/**
 * Parsea una fecha ISO string del backend y la convierte a una fecha local
 * sin problemas de zona horaria. Si la fecha viene como "2026-01-08T00:00:00.000Z",
 * la convierte correctamente a una fecha local del día 8, no del día 7.
 */
export const parseTurnoDate = (fechaString: string): Date | null => {
  if (!fechaString) return null;
  
  try {
    const parsed = parseISO(fechaString);
    if (!isValid(parsed)) return null;
    
    // Extraer los componentes UTC y crear una fecha local con esos componentes
    // Esto evita problemas de zona horaria
    return new Date(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate()
    );
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Compara dos fechas de turnos para ordenamiento
 */
export const compareTurnoDates = (fechaA: string, fechaB: string): number => {
  const dateA = parseTurnoDate(fechaA);
  const dateB = parseTurnoDate(fechaB);
  
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;
  
  return dateA.getTime() - dateB.getTime();
};

