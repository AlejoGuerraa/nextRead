import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="protected-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Cargando tu sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/acceso" replace />;
  }

  return <Outlet />;
}
