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
import ResetPassword from './pages/resetPassword.jsx';
import Cookies from './pages/cookies';
import UserProfile from './pages/UserProfile.jsx';
import ConfirmDelete from './components/settings/confirmDelete.jsx';
import SobreNosotros from './pages/sobreNosotros';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ToastProvider } from './components/ToastProvider';
import { AuthProvider } from './context/AuthContext';

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
    } else if (path === "/nosotros") {
      document.title = "NextRead - Sobre Nosotros";
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
      { path: "/cookies", element: <Cookies /> },
      { path: "/nosotros", element: <SobreNosotros /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/libro/:id", element: <PaginaLibro /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/perfil", element: <Perfil /> },
          { path: "/perfil/editar", element: <EditarPerfil /> },
          { path: "/seguidores", element: <Seguidores /> },
          { path: "/seguidos", element: <Seguidos /> },
          { path: "/configuracion", element: <Configuracion /> },
          { path: "/user/:username", element: <UserProfile /> },
          { path: "/usuario/:username", element: <UserProfile /> },
          { path: "/confirm-delete", element: <ConfirmDelete /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
