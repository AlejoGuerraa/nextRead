import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { authApi, usersApi } from '../api/endpoints';

const TOKEN_KEY = 'nextread_token';
const USER_KEY = 'nextread_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // datos básicos (login / auth/me)
  const [profile, setProfile] = useState(null); // datos completos de /nextread/user
  const [guest, setGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(async () => {
    setAuthToken(null);
    setUser(null);
    setProfile(null);
    setGuest(false);
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } catch {
      // ignorar
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const full = await usersApi.getMe();
      setProfile(full);
      return full;
    } catch (error) {
      return null;
    }
  }, []);

  // Restaurar sesión al abrir la app
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [token, rawUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]).then((pairs) =>
          pairs.map(([, v]) => v)
        );
        if (!token) return;
        setAuthToken(token);
        if (rawUser && active) setUser(JSON.parse(rawUser));
        const me = await authApi.me();
        if (!active) return;
        setUser((prev) => ({ ...(prev || {}), ...me }));
        refreshProfile();
      } catch (error) {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          await clearSession();
        }
        // si es error de red mantenemos la sesión guardada
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [clearSession, refreshProfile]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
  }, [clearSession]);

  const login = useCallback(
    async (correo, contrasena) => {
      const payload = await authApi.login(correo.trim(), contrasena);
      const { token, ...userData } = payload;
      setAuthToken(token);
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_KEY, JSON.stringify(userData)],
      ]);
      setGuest(false);
      setUser(userData);
      refreshProfile();
      return userData;
    },
    [refreshProfile]
  );

  const register = useCallback(
    async (form) => {
      await authApi.register(form);
      return login(form.correo, form.contrasena);
    },
    [login]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      guest,
      loading,
      isLogged: Boolean(user?.id),
      login,
      register,
      logout: clearSession,
      refreshProfile,
      enterAsGuest: () => setGuest(true),
      exitGuest: () => setGuest(false),
    }),
    [user, profile, guest, loading, login, register, clearSession, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
