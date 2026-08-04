import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken, validateSession, clearAuth } from '../../services/authService';

export default function ProtectedRoute() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      const token = getToken();
      if (!token) {
        if (isMounted) setStatus('unauthenticated');
        return;
      }

      try {
        await validateSession();
        if (isMounted) setStatus('authenticated');
      } catch (err) {
        clearAuth();
        if (isMounted) setStatus('unauthenticated');
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="protected-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <p>Cargando tu sesión...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/acceso" replace />;
  }

  return <Outlet />;
}
