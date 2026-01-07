import { createContext, useState, useEffect, type ReactNode } from 'react';

const API_URL = 'https://andorra-back-1.onrender.com/api/dias-no-disponibles';

interface DiaNoDisponible {
  _id: string;
  fecha: string;
  horarios: string[];
}

interface DisponibilidadContextType {
  diasNoDisponibles: DiaNoDisponible[];
  addDiaNoDisponible: (fecha: string, horarios: string[]) => Promise<void>;
  deleteDiaNoDisponible: (fecha: string, horario?: string) => Promise<void>;
}

export const DisponibilidadContext = createContext<DisponibilidadContextType | undefined>(undefined);

export const DisponibilidadProvider = ({ children }: { children: ReactNode }) => {
  const [diasNoDisponibles, setDiasNoDisponibles] = useState<DiaNoDisponible[]>([]);

  // Función helper para normalizar fecha a string YYYY-MM-DD
  const normalizeFecha = (fecha: string | Date | unknown): string => {
    if (!fecha) return '';
    if (typeof fecha === 'string') {
      // Si ya es string, verificar formato
      if (fecha.includes('T')) {
        return fecha.split('T')[0];
      }
      return fecha;
    }
    // Si es Date object
    if (fecha instanceof Date) {
      const year = fecha.getUTCFullYear();
      const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
      const day = String(fecha.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  useEffect(() => {
    const fetchDiasNoDisponibles = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        // Normalizar las fechas a formato YYYY-MM-DD
        const normalized = data.map((dia: { _id: string; fecha: string | Date; horarios?: string[] }) => ({
          ...dia,
          fecha: normalizeFecha(dia.fecha),
          horarios: Array.isArray(dia.horarios) ? dia.horarios : []
        }));
        setDiasNoDisponibles(normalized);
      } catch (error) {
        console.error('Error fetching dias no disponibles:', error);
      }
    };
    fetchDiasNoDisponibles();
  }, []);

  const addDiaNoDisponible = async (fecha: string, horarios: string[]) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, horarios }),
      });
      if (res.ok) {
        // Refrescar desde el servidor para obtener datos actualizados
        const refreshRes = await fetch(API_URL);
        const data = await refreshRes.json();
        const normalized = data.map((dia: { _id: string; fecha: string | Date; horarios?: string[] }) => ({
          ...dia,
          fecha: normalizeFecha(dia.fecha),
          horarios: Array.isArray(dia.horarios) ? dia.horarios : []
        }));
        setDiasNoDisponibles(normalized);
      }
    } catch (error) {
      console.error('Error adding dia no disponible:', error);
    }
  };

  const deleteDiaNoDisponible = async (fecha: string, horario?: string) => {
    try {
      await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, horario }),
      });
      
      // Siempre hacer GET después del DELETE para obtener datos actualizados
      // No importa si el DELETE fue exitoso o no, siempre refrescamos
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const refreshRes = await fetch(API_URL);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const normalized = data.map((dia: { _id: string; fecha: string | Date; horarios?: string[] }) => ({
          ...dia,
          fecha: normalizeFecha(dia.fecha),
          horarios: Array.isArray(dia.horarios) ? dia.horarios : []
        }));
        setDiasNoDisponibles(normalized);
      }
    } catch (error) {
      console.error('Error deleting dia no disponible:', error);
      // Incluso si hay error, intentar refrescar los datos
      try {
        const refreshRes = await fetch(API_URL);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          const normalized = data.map((dia: { _id: string; fecha: string | Date; horarios?: string[] }) => ({
            ...dia,
            fecha: normalizeFecha(dia.fecha),
            horarios: Array.isArray(dia.horarios) ? dia.horarios : []
          }));
          setDiasNoDisponibles(normalized);
        }
      } catch (refreshError) {
        console.error('Error refreshing after delete:', refreshError);
      }
    }
  };

  return (
    <DisponibilidadContext.Provider value={{ diasNoDisponibles, addDiaNoDisponible, deleteDiaNoDisponible }}>
      {children}
    </DisponibilidadContext.Provider>
  );
};
