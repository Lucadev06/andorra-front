import { useState, useEffect } from "react";
import {
  Drawer,
  Box,
  Button,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  IconButton,
  Typography
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PeopleIcon from "@mui/icons-material/People";
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LogoutIcon from '@mui/icons-material/Logout';
import Turnos from "./turnos/Turnos";
import Disponibilidad from "./disponibilidad/Disponibilidad";
import AdminPasswordDialog from "./AdminPasswordDialog";
import { drawerPaperStyles, buttonStyles } from "../components/styles";

const DRAWER_WIDTH = 240;

function Admin() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [seccion, setSeccion] = useState("turnos");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = localStorage.getItem("adminAuthenticated");
      const expiry = localStorage.getItem("adminSessionExpiry");
      
      if (authenticated === "true" && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          setIsAuthenticated(true);
          return;
        } else {
          // Sesión expirada
          localStorage.removeItem("adminAuthenticated");
          localStorage.removeItem("adminSessionExpiry");
        }
      }
      
      // Si no está autenticado, mostrar el diálogo
      setShowPasswordDialog(true);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordDialog(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminSessionExpiry");
    setIsAuthenticated(false);
    setShowPasswordDialog(true);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSeccionChange = (nuevaSeccion: string) => {
    setSeccion(nuevaSeccion);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const renderContent = () => {
    switch (seccion) {
      case "turnos":
        return <Turnos />;
      case "disponibilidad":
        return <Disponibilidad />;
      default:
        return <Turnos />;
    }
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <img src="/logo-final.png" alt="logo" style={{ maxWidth: '80%', height: 'auto' }} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          mt: 2,
          px: 2,
        }}
      >
        <Button
          startIcon={<PeopleIcon />}
          sx={{
            ...buttonStyles,
            backgroundColor: seccion === "turnos" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
            },
          }}
          onClick={() => handleSeccionChange("turnos")}
        >
          Turnos
        </Button>
        <Button
          startIcon={<EventAvailableIcon />}
          sx={{
            ...buttonStyles,
            backgroundColor: seccion === "disponibilidad" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.15)",
            },
          }}
          onClick={() => handleSeccionChange("disponibilidad")}
        >
          Disponibilidad
        </Button>
        <Button
          startIcon={<LogoutIcon />}
          sx={{
            ...buttonStyles,
            mt: 'auto',
            mb: 2,
            color: 'error.main',
            "&:hover": {
              backgroundColor: "rgba(255, 0, 0, 0.1)",
            },
          }}
          onClick={handleLogout}
        >
          Cerrar sesión
        </Button>
      </Box>
    </Box>
  );

  // Si no está autenticado, mostrar solo el diálogo de password
  if (!isAuthenticated) {
    return (
      <AdminPasswordDialog
        open={showPasswordDialog}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* AppBar para móvil */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { sm: `${DRAWER_WIDTH}px` },
            backgroundColor: "black",
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Administración
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Drawer móvil temporal */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Mejor rendimiento en móvil
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              ...drawerPaperStyles,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer desktop permanente */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
              ...drawerPaperStyles,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Contenido principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 7, md: 0 },
          minHeight: "100vh",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}

export default Admin;
