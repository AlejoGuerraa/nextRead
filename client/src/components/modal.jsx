import React, { useEffect, useRef } from "react";
import '../pagescss/modal.css'; 

export function Modal({ openModal, closeModal, children, extraClass = "" }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Abre o cierra el modal de forma nativa
    if (openModal) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }

    // Limpieza al desmontar
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [openModal]);

  // Manejador del boton "X"
  const handleClose = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    closeModal();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal-dialog ${extraClass}`}
      onCancel={handleClose}
    >
      <button className="close-button" onClick={handleClose}>
        ✕
      </button>

      {children}
    </dialog>
  );
}