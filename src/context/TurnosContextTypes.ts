import { createContext } from "react";

// Interfaces
export interface Peluquero {
  _id: string;
  nombre: string;
}

export interface Turno {
  _id:string;
  peluquero: string | Peluquero;
  cliente: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

// Context
export interface TurnosContextType {
  turnos: Turno[];
  addTurno: (newTurno: Omit<Turno, "_id">) => Promise<void>;
  updateTurno: (updatedTurno: Turno) => Promise<void>;
}

export const TurnosContext = createContext<TurnosContextType | undefined>(
  undefined
);
