import { createContext } from "react";

// Interfaces
export interface Turno {
  _id:string;
  cliente: string;
  mail: string;
  fecha: string;
  hora: string;
  servicio?: string;
}

// Context
export interface TurnosContextType {
  turnos: Turno[];
  addTurno: (newTurno: Omit<Turno, "_id">) => Promise<void>;
  updateTurno: (updatedTurno: Turno) => Promise<void>;
  deleteTurno: (id: string) => Promise<void>;
}

export const TurnosContext = createContext<TurnosContextType | undefined>(
  undefined
);
