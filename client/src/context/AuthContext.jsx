import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearAuth,
  getStoredUser,
  getToken,
  loginUser,
  storeAuthSession,
  validateSession,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getToken()) && Boolean(getStoredUser()));
  const [loading, setLoading] = useState(true);

  const syncAuthState = useCallback((nextUser, authenticated) => {
    setUser(nextUser);
    setIsAuthenticated(Boolean(authenticated) && Boolean(nextUser));
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getToken();

    if (!token) {
      clearAuth();
      syncAuthState(null, false);
      return null;
    }

    try {
      const nextUser = await validateSession();
      syncAuthState(nextUser, true);
      return nextUser;
    } catch (error) {
      clearAuth();
      syncAuthState(null, false);
      throw error;
    }
  }, [syncAuthState]);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const token = getToken();

        if (!token) {
          if (isMounted) {
            syncAuthState(null, false);
          }
          return;
        }

        const nextUser = await validateSession();

        if (isMounted) {
          syncAuthState(nextUser, true);
        }
      } catch (_error) {
        if (isMounted) {
          clearAuth();
          syncAuthState(null, false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [syncAuthState]);

  const login = useCallback(async (credentials) => {
    const response = await loginUser(credentials);
    const payload = response?.data ?? response;
    const nextUser = {
      ...(payload || {}),
      ...(credentials?.correo ? { correo: credentials.correo } : {}),
    };

    syncAuthState(nextUser, true);
    return nextUser;
  }, [syncAuthState]);

  const logout = useCallback((redirect = null) => {
    clearAuth();
    syncAuthState(null, false);

    if (typeof redirect === 'function') {
      redirect();
    }
  }, [syncAuthState]);

  const value = useMemo(() => ({
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUser,
  }), [user, isAuthenticated, loading, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
