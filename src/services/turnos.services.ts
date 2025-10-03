import { API_URL } from "../config";

export interface Turno {
  _id: string;
  peluquero: string | { _id: string; nombre: string };
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

export const getTurnos = async (): Promise<Turno[]> => {
  const response = await fetch(`${API_URL}/turnos`);
  if (!response.ok) {
    throw new Error("Error al cargar los turnos");
  }
  const data = await response.json();
  return data.data || [];
};
