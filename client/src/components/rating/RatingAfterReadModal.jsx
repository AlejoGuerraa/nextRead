import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useToast } from "../ToastProvider";
import { saveBookRating } from "../../services/booksService";
import "./RatingAfterReadModal.css";

export default function RatingAfterReadModal({ isOpen, bookId, onClose, onSaved }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setHoverRating(0);
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating || isSaving) return;

    setIsSaving(true);
    try {
      const response = await saveBookRating(bookId, rating);
      toast?.push(response.message || "Valoración guardada correctamente", "success");
      onSaved?.();
    } catch (error) {
      toast?.push(error.response?.data?.error || "No se pudo guardar la valoración.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rating-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="rating-modal" role="dialog" aria-modal="true" aria-labelledby="rating-modal-title">
        <button className="rating-modal-close" type="button" onClick={onClose} aria-label="Cerrar valoración">
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="rating-modal-title">¿Qué te pareció este libro?</h2>
        <p>Tu valoración nos ayuda a mejorar tus recomendaciones.</p>

        <div className="rating-modal-stars" role="radiogroup" aria-label="Selecciona una puntuación de 1 a 5 estrellas">
          {Array.from({ length: 5 }, (_, index) => {
            const value = index + 1;
            const isActive = value <= (hoverRating || rating);

            return (
              <button
                key={value}
                type="button"
                className={isActive ? "is-active" : ""}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}`}
              >
                {isActive ? "★" : "☆"}
              </button>
            );
          })}
        </div>

        <button className="rating-modal-submit" type="button" onClick={handleSubmit} disabled={!rating || isSaving}>
          {isSaving ? "Guardando..." : "Confirmar valoración"}
        </button>
      </section>
    </div>
  );
}