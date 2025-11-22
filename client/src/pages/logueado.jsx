import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../pagescss/logueado.css";

const mockCarouselData = [
  { id: 1, imgUrl: "https://placehold.co/500x280/1A374D/ffffff?text=Ficción+Clásica" },
  { id: 2, imgUrl: "https://placehold.co/500x280/406882/ffffff?text=Misterio+y+Thriller" },
  { id: 3, imgUrl: "https://placehold.co/500x280/6998AB/ffffff?text=Ciencia+Ficción" },
  { id: 4, imgUrl: "https://placehold.co/500x280/406882/ffffff?text=Romance+Histórico" },
];

const Logueado = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);
  const [libros, setLibros] = useState([]);
  const navigate = useNavigate();

  const listRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) navigate("/login");
    else setUser(JSON.parse(storedUser));
  }, [navigate]);

  useEffect(() => {
    fetch("http://localhost:3000/nextread/libros")
      .then(res => res.json())
      .then(data => setLibros(data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const listNode = listRef.current;
    if (listNode) {
      const imgNode = listNode.children[currentIndex];
      if (imgNode) {
        imgNode.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [currentIndex]);

  const scrollToImage = (direction) => {
    const totalSlides = mockCarouselData.length;
    if (direction === 'prev') setCurrentIndex(curr => (curr === 0 ? 0 : curr - 1));
    else setCurrentIndex(curr => (curr === totalSlides - 1 ? totalSlides - 1 : curr + 1));
  };

  const goToSlide = (slideIndex) => setCurrentIndex(slideIndex);

  return (
    <div className="logueado-container">
      {/* HEADER */}
      <header className="logueado-header">
        <div className="header-left">
          <div className="logo">📚</div>
          <span className="app-title">NextRead</span>
          <input
            type="text"
            placeholder="Buscar libros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
        </div>

        <div className="header-right">
          <div className="icon">🔔</div>
          <div className="icon">⚙️</div>

          <div className="profile" onClick={() => navigate("/perfil")} title="Ir al perfil">
            <span>👤</span>
            <span className="profile-name">{user?.nombre}</span>
          </div>

          <select className="genre-select">
            <option>Género...</option>
            <option>Terror</option>
            <option>Romance</option>
            <option>Clásicos</option>
          </select>
        </div>
      </header>

      {/* MAIN */}
      <main className="logueado-main">
        {/* Carrusel */}
        <div className="slider-container">
          <div
            className={`arrow left ${currentIndex === 0 ? "disabled" : ""}`}
            onClick={() => scrollToImage("prev")}
          >
            &#10092;
          </div>
          <div
            className={`arrow right ${currentIndex === mockCarouselData.length - 1 ? "disabled" : ""}`}
            onClick={() => scrollToImage("next")}
          >
            &#10093;
          </div>

          <div className="container-images">
            <ul ref={listRef}>
              {mockCarouselData.map((item) => (
                <li key={item.id}>
                  <img src={item.imgUrl} alt="Portada de libro" />
                </li>
              ))}
            </ul>
          </div>

          <div className="dots-container">
            {mockCarouselData.map((_, idx) => (
              <div
                key={idx}
                className={`dot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => goToSlide(idx)}
              ></div>
            ))}
          </div>
        </div>

        {/* Libros desde backend */}
        <section className="book-section">
          <h3>Tendencias y Novedades</h3>
          <div className="book-scroll">
            {libros.map((book) => (
              <div
                key={book.id}
                className="book-card"
                onClick={() => navigate(`/libro/${book.id}`)}
              >
                <div className="book-cover">📖</div>
                <span className="book-title">{book.titulo}</span>
                <span className="book-author">{book.autor}</span>
                <span className="book-stars">
                  {"★".repeat(Math.round(book.ranking)) +
                    "☆".repeat(5 - Math.round(book.ranking))}{" "}
                  ({book.ranking})
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Logueado;
