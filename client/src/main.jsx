import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import Principal from './pages/principal';
import Acceso from './pages/acceso';
import Perfil from './pages/perfil';
import PaginaLibro from './pages/libro';
import EditarPerfil from './pages/editarPerfil';
import Seguidores from './pages/seguidores';
import Seguidos from './pages/seguidos';
import Configuracion from './pages/configuracion';
import ResetPassword from './pages/ResetPassword';
import Cookies from './pages/cookies';

// 👇 IMPORTAMOS LA NUEVA PÁGINA
import UserProfile from './pages/UserProfile.jsx';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ToastProvider } from './components/ToastProvider';

// Componente que gestiona el título de la página
function TitleManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    if (path.startsWith("/libro/")) {
      document.title = "NextRead - Detalle del libro";
    } else if (path === "/acceso") {
      document.title = "NextRead - Acceder";
    } else if (path === "/principal") {
      document.title = "NextRead - Página principal";
    } else if (path === "/perfil") {
      document.title = "NextRead - Mi perfil";
    } else if (path === "/perfil/editar") {
      document.title = "NextRead - Editar perfil";
    } else if (path === "/seguidores") {
      document.title = "NextRead - Seguidores";
    } else if (path === "/configuracion") {
      document.title = "NextRead - Configuracion";
    } else if (path === "/seguidos") {
      document.title = "NextRead - Seguidos";
    } else if (path.startsWith("/user/")) {
      document.title = "NextRead - Perfil de usuario";
    } else if (path === "/") {
      document.title = "NextRead - Inicio";
    } else if (path === "/reset-password") {
      document.title = "NextRead - Restablecer Contraseña";
    } else if (path === "/cookies") {
      document.title = "NextRead - Cookies";
    } else {
      document.title = "NextRead 📚";
    }
  }, [location]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <TitleManager />,
    children: [
      { path: "/", element: <Principal /> },
      { path: "/acceso", element: <Acceso /> },
      { path: "/perfil", element: <Perfil /> },
      { path: "/perfil/editar", element: <EditarPerfil /> },
      { path: "/libro/:id", element: <PaginaLibro /> },
      { path: "/seguidores", element: <Seguidores /> },
      { path: "/seguidos", element: <Seguidos /> },
      { path: "/configuracion", element: <Configuracion /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/cookies", element: <Cookies /> },

      // 👇 **RUTA NUEVA PARA VER PERFILES DE USUARIOS**
      { path: "/user/:username", element: <UserProfile /> },
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>
);
