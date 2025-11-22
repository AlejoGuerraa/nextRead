import React, { useEffect, useRef } from 'react';
import '../pagescss/loguearse_registrarse.css';

export function Modal({ openModal, closeModal, children }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (openModal) ref.current.showModal();
    else ref.current.close();
  }, [openModal]);

  return (
    <dialog ref={ref} onCancel={closeModal} className="modal-dialog">
      {children}
      <button onClick={closeModal} aria-label="Cerrar modal" className="close-button">
        ✕
      </button>

      <style>{`
        .modal-dialog {
          border: none;
          border-radius: 16px;
          padding: 30px;
          background: white;
          width: 500px;
          max-width: 90%;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .close-button {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 22px;
          cursor: pointer;
          color: #3454d1;
        }
        .close-button:hover {
          color: #1a2a42;
        }
      `}</style>
    </dialog>
  );
}
