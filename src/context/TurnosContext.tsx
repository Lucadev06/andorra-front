
import { useState, useEffect, type ReactNode } from "react";
import { type Turno, TurnosContext } from "./TurnosContextTypes";

// Provider
interface TurnosProviderProps {
  children: ReactNode;
}

export const TurnosProvider = ({ children }: TurnosProviderProps) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const API_URL = "https://andorra-back-1.onrender.com/api";

  async function fetchTurnos() {
    try {
      const res = await fetch(`${API_URL}/turnos`);
      const data = await res.json();
      setTurnos(data.data || []);
    } catch (error) {
      console.error("Error fetching turnos:", error);
    }
  }

  useEffect(() => {
    fetchTurnos();
  }, []);

  const addTurno = async (newTurno: Omit<Turno, "_id">) => {
    try {
      const res = await fetch(`${API_URL}/turnos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTurno),
      });
      if (res.ok) {
        fetchTurnos(); // Re-fetch all turnos to get the latest list
      } else {
        if (res.status === 409) {
          throw new Error("409");
        }
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add turno");
      }
    } catch (error) {
      console.error("Error adding turno:", error);
      throw error;
    }
  };

  const updateTurno = async (updatedTurno: Turno) => {
    try {
      const res = await fetch(`${API_URL}/turnos/${updatedTurno._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTurno),
      });
      if (res.ok) {
        fetchTurnos(); // Re-fetch all turnos
      } else {
        if (res.status === 409) {
          throw new Error("409");
        }
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update turno");
      }
    } catch (error) {
      console.error("Error updating turno:", error);
      throw error;
    }
  };

  return (
    <TurnosContext.Provider value={{ turnos, addTurno, updateTurno }}>
      {children}
    </TurnosContext.Provider>
  );
};
