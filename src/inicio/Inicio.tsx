import { Box, Button } from "@mui/material";
import { useState } from "react";
import AgregarTurnosDialog from "../turnos/AgregarTurnosDialog";
import { Instagram } from "@mui/icons-material";

export default function Inicio() {
  const [openDialog, setOpenDialog] = useState(false);

  return (
    <>
      <Box
        sx={{
          backgroundColor: "black",
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 3,
          p: 2,
        }}
      >
        <Box
          component="img"
          src="/logo.png"
          alt="Logo Andorra Barber Club"
          sx={{
            maxWidth: "300px",
            width: "80%",
            objectFit: "contain",
          }}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{
            backgroundColor: "#F2A900",
            color: "black",
            fontWeight: "bold",
            "&:hover": { backgroundColor: "#d98f00" },
          }}
          onClick={() => setOpenDialog(true)}
        >
          Sacar turno
        </Button>
          <Button>
          <a href="https://www.instagram.com/andorra.barberclub/?hl=es" target="_blank">
            <Instagram sx={{color: "blue"}}/>
          </a>
        </Button>
      </Box>
         
      {/* Dialog */}
      <AgregarTurnosDialog open={openDialog} onClose={() => setOpenDialog(false)} />
    </>
  );
}
