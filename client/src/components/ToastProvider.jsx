import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import './ToastProvider.css';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.map((toast) => (
      toast.id === id ? { ...toast, leaving: true } : toast
    )));

    const removalTimer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      timers.current.delete(id);
    }, 180);

    timers.current.set(id, removalTimer);
  }, []);

  const push = useCallback((message, type = 'info', ttl = 4000) => {
    const id = Date.now() + Math.random();
    const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const toast = { id, message, type: normalizedType, leaving: false };

    setToasts((current) => [...current.filter((item) => !item.leaving), toast].slice(-3));
    if (ttl > 0) {
      const timer = window.setTimeout(() => dismiss(id), ttl);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  const remove = useCallback((id) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }, []);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  return (
    <ToastContext.Provider value={{ push, remove }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <div
              key={toast.id}
              className={`toast-item toast-item--${toast.type}${toast.leaving ? ' toast-item--leaving' : ''}`}
              role={toast.type === 'error' ? 'alert' : 'status'}
            >
              <Icon className="toast-icon" size={18} aria-hidden="true" />
              <span className="toast-message">{toast.message}</span>
              <button className="toast-close" type="button" onClick={() => remove(toast.id)} aria-label="Cerrar aviso">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
