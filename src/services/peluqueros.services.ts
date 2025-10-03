import { API_URL } from "../config";

export interface Peluquero {
  _id: string;
  nombre: string;
}

export const getPeluqueros = async (): Promise<Peluquero[]> => {
  const response = await fetch(`${API_URL}/peluqueros`);
  if (!response.ok) {
    throw new Error("Error al cargar los peluqueros");
  }
  const data = await response.json();
  return data.data || [];
};
