import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Principal from './pages/principal';
import Acceso from './pages/acceso';
import Perfil from './pages/perfil';
import PaginaLibro from './pages/libro';
import EditarPerfil from './pages/editarPerfil';
import Seguidores from './pages/seguidores';
import Seguidos from './pages/seguidos';

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function TitleManager() {
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
    } else if (path === "/seguidos") {
      document.title = "NextRead - Seguidos";
    } else {
      document.title = "NextRead 📚";
    }
  }, [location]);

  return null;
}

const router = createBrowserRouter([
  { path: "/", element: <Principal /> },
  { path: "/acceso", element: <Acceso /> },
  { path: "/perfil", element: <Perfil /> },
  { path: "/perfil/editar", element: <EditarPerfil /> },
  { path: "/libro/:id", element: <PaginaLibro /> },
  { path: "/seguidores", element: <Seguidores /> },
  { path: "/seguidos", element: <Seguidos /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);