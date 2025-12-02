import React, { useEffect, useRef } from "react";
import "../../pagescss/modal.css";

export function Modal({ openModal, closeModal, children, extraClass = "" }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (openModal) {
      if (!dialog.open) {
        dialog.showModal();
        dialog.classList.add("modal-fade-in");
      }
    } else {
      if (dialog.open) dialog.close();
    }

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [openModal]);

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
