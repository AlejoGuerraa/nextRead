import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Logueado from './pages/logueado';
import Invitado from './pages/invitado';
import Registrarse from './pages/registrarse';
import Loguearse from './pages/loguearse';
import Perfil from './pages/perfil';
import PaginaLibro from './pages/libroDetalles'; 

const router = createBrowserRouter([
  {
    path: "/",
    element: <Invitado />,
  },
  {
    path: "/invitado",
    element: <Invitado />,
  },
  {
    path: "/logueado",
    element: <Logueado />,
  },
  {
    path: "/registrarse",
    element: <Registrarse />,
  },
  {
    path: "/loguearse",
    element: <Loguearse />,
  },
  {
    path: "/perfil",
    element: <Perfil />,
  },
  {
    path: "/libro/:id", 
    element: <PaginaLibro />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
