import React, { useEffect, useRef } from 'react';
import '../pagescss/modal.css'; 

export function Modal({ openModal, closeModal, children }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!ref.current) return;
    
    if (openModal) {
      ref.current.showModal(); 
    } else {
      ref.current.close();
    }
  }, [openModal]);

  return (
    <dialog ref={ref} onCancel={closeModal} className="modal-dialog">
      {children} 
      <button onClick={closeModal} aria-label="Cerrar modal" className="close-button">
        ✕
      </button>
    </dialog>
  );
}