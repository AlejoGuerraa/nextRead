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
      <button onClick={closeModal} aria-label="Cerrar modal" className="close-button-nextread">
        ✕
      </button>

            <style>{`
        .modal-dialog {
          padding: 2rem;
          border-radius: 15px;
          border: none;
          width: 420px;
          height: 480px;
          max-width: 90vw;
          background: #f2f4f8;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          position: relative;
          text-align: center;


        }

        dialog::backdrop {
          background: rgba(0, 0, 0, 0.6);
        }

        .close-button-nextread {
          position: absolute;
          top: 15px;
          right: 15px;
          
          background-color: #f0c14b;
          color: #333;
          border: none;
          width: 35px;
          height: 33px;
          border-radius: 4px;
          font-size: 20px;
          
          display: flex; /* centra el contenido (la “x”) */
          align-items: center;
          justify-content: center;
          
          cursor: pointer;
          transition: background 0.2s;

          z-index: 10;
        }


        .close-button-nextbook:hover {
          background-color: #d4a836ff;
        }
      `}</style>
    </dialog>
  );
}
