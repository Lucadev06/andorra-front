import { Box, Button } from "@mui/material";
import { useState } from "react";
import AgregarTurnosDialog from "../turnos/AgregarTurnosDialog";
import MisTurnosDialog from "../turnos/MisTurnosDialog";
import { Instagram } from "@mui/icons-material";
import { mainContainerStyles, logoStyles, buttonStylesInicio } from "../components/styles";

export default function Inicio() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openMisTurnos, setOpenMisturnos] = useState(false)
  
  return (
    <>
      <Box sx={mainContainerStyles}>
        <Box
          component="img"
          src="/logo.png"
          alt="Logo Andorra Barber Club"
          sx={logoStyles}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={buttonStylesInicio}
          onClick={() => setOpenDialog(true)}
        >
          Sacar turno
        </Button>

        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={buttonStylesInicio}
          onClick={() => setOpenMisturnos(true)}
        >
          Mis turnos
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Button component="a" href="https://www.instagram.com/andorra.barberclub/?hl=es" target="_blank" sx={{ color: 'white' }}>
            <Instagram />
          </Button>
        </Box>
      </Box>
         
      <AgregarTurnosDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />

      <MisTurnosDialog
        open={openMisTurnos}
        onClose={() => setOpenMisturnos(false)}
      />
    </>
  );
}
