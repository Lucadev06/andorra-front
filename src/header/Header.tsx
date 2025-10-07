import React from "react";
import { AppBar, Toolbar, Typography, Button, Avatar } from "@mui/material";

interface HeaderProps {
  user: { name: string; picture?: string } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  if (!user) return null; // si no hay user, no mostrar nada

  return (
    <AppBar position="static" sx={{ backgroundColor: "black" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "right" }}>
       {user.picture && (
  <Avatar alt={user.name} src={user.picture} sx={{ mr: 1 }} />
)}

        <Typography variant="body1" sx={{ mr: 2 }}>
          {user.name}
        </Typography>
        <Button color="inherit" onClick={onLogout}>
          Cerrar Sesión
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
