import { useState } from "react";
import {
  Drawer,
  Box,
  Button
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import PeopleIcon from "@mui/icons-material/People";
import Dashboard from "./dashboard/Dashboard"
import Turnos from "./turnos/Turnos";
import Peluqueros from "./peluqueros/Peluqueros";
import { drawerStyles, drawerPaperStyles, contentBoxStyles, buttonStyles } from "../components/styles";

function Admin() {
  const [seccion, setSeccion] = useState("dashboard"); // 👈 arranca en dashboard

  const renderContent = () => {
    switch (seccion) {
      case "dashboard":
        return <Dashboard />;
      case "peluqueros":
        return <Peluqueros />;
      case "turnos":
        return <Turnos />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
    <Box sx={{backgroundColor: "white"}}>
      <Drawer
        variant="permanent"
        sx={drawerStyles}
        PaperProps={{
          sx: drawerPaperStyles,
        }}
      >
        <img src="/logo.png" alt="logo" />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            textAlign: "center",
            marginTop: "2rem",
            gap: "1rem",
            marginLeft: "2rem",
          }}
        >
          <Button
            startIcon={<DashboardIcon />}
            sx={buttonStyles}
            onClick={() => setSeccion("dashboard")}
          >
            Dashboard
          </Button>
          <Button
            startIcon={<ContentCutIcon />}
            sx={buttonStyles}
            onClick={() => setSeccion("peluqueros")}
          >
            Peluqueros
          </Button>
          <Button
            startIcon={<PeopleIcon />}
            sx={buttonStyles}
            onClick={() => setSeccion("turnos")}
          >
            Turnos
          </Button>
        </Box>
      </Drawer>

      {/* 👇 contenido dinámico a la derecha del menú */}
      <Box sx={contentBoxStyles}>
        {renderContent()}
      </Box>
      </Box>
    </>
  );
}

export default Admin;
