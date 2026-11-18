import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../pagescss/authorsCarousel.css';

export default function AuthorsCarousel({ autores }) {
  const navigate = useNavigate();

  if (!Array.isArray(autores) || autores.length === 0) return null;

  return (
    <div className="authors-carousel">
      {autores.map((author) => (
        <button
          className="author-carousel-card"
          key={author.id}
          onClick={() => navigate(`/autor/${author.id}`)}
          type="button"
        >
          {author.url_cara ? (
            <img src={author.url_cara} alt="" className="author-carousel-image" />
          ) : (
            <span className="author-carousel-placeholder" aria-hidden="true">
              ✍
            </span>
          )}
          <span>{author.nombre}</span>
        </button>
      ))}
    </div>
  );
}
