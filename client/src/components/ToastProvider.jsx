import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type = 'info', ttl = 4000) => {
    const id = Date.now() + Math.random();
    const t = { id, message, type };
    setToasts((s) => [...s, t]);
    if (ttl > 0) setTimeout(() => setToasts((s) => s.filter(x => x.id !== id)), ttl);
  }, []);

  const remove = useCallback((id) => setToasts((s) => s.filter(x => x.id !== id)), []);

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div style={{ position: 'fixed', right: 20, top: 20, zIndex: 99999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            marginBottom: 8,
            minWidth: 240,
            padding: '10px 14px',
            borderRadius: 8,
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            color: '#fff',
            background: t.type === 'error' ? '#d64545' : t.type === 'success' ? '#2b9348' : '#406882'
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
