import React from 'react';
import ReactDOM from 'react-dom/client';
// Importa el Router
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; 
import Logueado from './pages/logueado';
import Invitado from './pages/invitado';
import Registrarse from './pages/registrarse';
import Loguearse from './pages/loguearse'; // 👈 ¡AGREGA ESTA LÍNEA!
import Perfil from './pages/perfil';
// Define tus rutas. Esto debería estar idealmente en App.jsx o un archivo de rutas.
const router = createBrowserRouter([  
  {
    path: "/",
    element: <Invitado/>, // O <App /> si App es tu componente principal
  },
  {
    path: "/logueado",
    element: <Logueado/>, // O <App /> si App es tu componente principal
  },
  {
    path: "/registrarse",
    element: <Registrarse/>, // O <App /> si App es tu componente principal
  },
  {
    path: "/loguearse",
    element: <Loguearse/>, // O <App /> si App es tu componente principal
  },
  {
    path : "/invitado",
    element: <Invitado/>
  },
  {
  path : "perfil",
  element: <Perfil/>
  }
  
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Usas RouterProvider aquí */}
    <RouterProvider router={router} />
  </React.StrictMode>
);