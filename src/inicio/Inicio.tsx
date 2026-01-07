import { Box, Button } from "@mui/material";
import { useState } from "react";
import AgregarTurnosDialog from "../turnos/AgregarTurnosDialog";
import MisTurnosDialog from "../turnos/MisTurnosDialog";
import { Instagram } from "@mui/icons-material";
import { mainContainerStyles, logoStyles, buttonStylesInicio } from "../components/styles";
import Header from "../header/Header";
import { useAuth } from "../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from '@mui/icons-material/Google';
import { useEffect } from "react";
import { parseTurnoDate } from "../utils/dateUtils";
interface Turno {
  _id: string;
  fecha: string;
  hora: string;
  peluquero: {
    nombre: string;
  };
  servicio: string;
}

export default function Inicio() {
  const [openDialog, setOpenDialog] = useState(false);
  const [openMisTurnos, setOpenMisTurnos] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await res.json();

        const userProfile = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture, // ✅ viene siempre
        };

        login(userProfile);
      } catch (err) {
        console.error("Error fetching Google profile", err);
      }
    },
    onError: () => console.log("Login Failed"),
  });


  const handleLogout = () => {
    logout();
  };

  const [hasTurnosVigentes, setHasTurnosVigentes] = useState(false);

  useEffect(() => {
    const fetchTurnos = async () => {
      if (!isAuthenticated || !user?.email) {
        setHasTurnosVigentes(false);
        return;
      }

      try {
        const response = await fetch(`https://andorra-back-1.onrender.com/api/turnos/email/${user.email}`);
        if (response.ok) {
          const data = await response.json();
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          const hayVigentes = data.data.some((t: Turno) => {
            const fechaTurno = parseTurnoDate(t.fecha);
            if (!fechaTurno) return false;
            fechaTurno.setHours(0, 0, 0, 0);
            return fechaTurno >= hoy;
          });
          setHasTurnosVigentes(hayVigentes);
        } else {
          setHasTurnosVigentes(false);
        }
      } catch (err) {
        console.error("Error al obtener turnos", err);
        setHasTurnosVigentes(false);
      }
    };

    fetchTurnos();
  }, [isAuthenticated, user?.email]);


  return (
    <>
      {isAuthenticated ? (
        <>
          {/* Header con usuario logueado */}
          <Header user={user} onLogout={handleLogout} />

          <Box sx={mainContainerStyles}>
            <Box
              component="img"
              src="/logo-final.png"
              alt="Logo Andorra Barber Club"
              sx={logoStyles}
            />
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={buttonStylesInicio}
              onClick={() => {
                if (hasTurnosVigentes) {
                  alert("Ya tenés un turno reservado, no podés sacar otro.");
                  return;
                }
                setOpenDialog(true);
              }}
            >
              Sacar turno
            </Button>


            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={buttonStylesInicio}
              onClick={() => setOpenMisTurnos(true)}
            >
              Mis turnos
            </Button>

            <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Button
                component="a"
                href="https://www.instagram.com/estudioparra_h/"
                target="_blank"
                sx={{ color: "white" }}
              >
                <Instagram />
              </Button>
            </Box>
          </Box>
        </>
      ) : (
        <>
          <Box sx={mainContainerStyles}>
            <Box
              component="img"
              src="/logo-final.png"
              alt="Logo Andorra Barber Club"
              sx={logoStyles}
            />
            <Button
              variant="outlined"
              startIcon={<GoogleIcon sx={{ color: "#4285f4" }} />}
              onClick={() => loginWithGoogle()}
              sx={{
                textTransform: "none",
                borderColor: "#dadce0",
                color: "rgba(0,0,0,0.54)",
                fontWeight: 500,
                backgroundColor: "#fff",
                "&:hover": {
                  backgroundColor: "#f7f7f7",
                  borderColor: "#dadce0",
                },
              }}
            >
              Continuar con Google
            </Button>


          </Box>
        </>
      )}

      <AgregarTurnosDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      />

      <MisTurnosDialog
        open={openMisTurnos}
        onClose={() => setOpenMisTurnos(false)}
        onTurnoCambiado={async () => {
          // Recargar turnos vigentes cuando se cancela o edita un turno
          if (isAuthenticated && user?.email) {
            try {
              const response = await fetch(`https://andorra-back-1.onrender.com/api/turnos/email/${user.email}`);
              if (response.ok) {
                const data = await response.json();
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const hayVigentes = data.data.some((t: Turno) => {
                  const fechaTurno = parseTurnoDate(t.fecha);
                  if (!fechaTurno) return false;
                  fechaTurno.setHours(0, 0, 0, 0);
                  return fechaTurno >= hoy;
                });
                setHasTurnosVigentes(hayVigentes);
              }
            } catch (err) {
              console.error("Error al obtener turnos", err);
            }
          }
        }}
      />
    </>
  );
}
