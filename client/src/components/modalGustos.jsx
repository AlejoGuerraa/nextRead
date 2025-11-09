import React, { useState } from "react";
import { Modal } from "../components/modal";

export function ModalGustos({ open, close, onFinish }) {
  const [step, setStep] = useState(1);
  const [seleccion, setSeleccion] = useState({ libros: [], generos: [], autores: [] });

  // --- Datos de Ejemplo ---
  const librosEjemplo = [
    { titulo: "1984", img: "/libros/1984.jpg", tipo: "libro" },
    { titulo: "Orgullo y prejuicio", img: "/libros/orgullo.jpg", tipo: "libro" },
    { titulo: "Harry Potter", img: "/libros/hp.jpg", tipo: "libro" },
    { titulo: "El señor de los anillos", img: "/libros/lotr.jpg", tipo: "libro" },
    { titulo: "Cien años de soledad", img: "/libros/cien.jpg", tipo: "libro" },
    { titulo: "El principito", img: "/libros/principito.jpg", tipo: "libro" },
    { titulo: "It", img: "/libros/it.jpg", tipo: "libro" },
    { titulo: "Los juegos del hambre", img: "/libros/hambre.jpg", tipo: "libro" },
    { titulo: "Don Quijote", img: "/libros/quijote.jpg", tipo: "libro" },
  ];

  const generosEjemplo = [
    { nombre: "Fantasía", icono: "🦄" },
    { nombre: "Ciencia ficción", icono: "🚀" },
    { nombre: "Romance", icono: "💖" },
    { nombre: "Misterio", icono: "🕵️" },
    { nombre: "Terror", icono: "👻" },
    { nombre: "Aventura", icono: "🗺️" },
    { nombre: "Novela Negra", icono: "🔪" },
  ];

  const autoresEjemplo = [
    { nombre: "Stephen King", color: "#a2d2ff" },
    { nombre: "Jane Austen", color: "#cdb4db" },
    { nombre: "J. K. Rowling", color: "#ffe066" },
    { nombre: "Gabriel García Márquez", color: "#ffc8dd" },
    { nombre: "Tolkien", color: "#bde0fe" },
    { nombre: "Agatha Christie", color: "#ffafcc" },
    { nombre: "Miguel de Cervantes", color: "#f7a9a8" },
  ];

  // --- Funciones de Selección y Navegación ---
  const MAX_LIBROS = 5;
  const MAX_GENEROS = 3;
  const MAX_AUTORES = 3;

  const toggleSeleccion = (tipo, valor, max) => {
    setSeleccion((prev) => {
      const actual = prev[tipo];
      const existe = actual.includes(valor);

      if (existe) {
        return { ...prev, [tipo]: actual.filter((v) => v !== valor) };
      } else if (actual.length < max) {
        return { ...prev, [tipo]: [...actual, valor] };
      } else {
        alert(`Solo puedes seleccionar ${max} ${tipo}.`);
        return prev;
      }
    });
  };

  const nextStep = () => {
    let isValid = true;
    if (step === 1 && seleccion.libros.length !== MAX_LIBROS) {
      alert(`Debes seleccionar ${MAX_LIBROS} libros.`);
      isValid = false;
    }
    if (step === 2 && seleccion.generos.length !== MAX_GENEROS) {
      alert(`Debes seleccionar ${MAX_GENEROS} géneros.`);
      isValid = false;
    }

    if (isValid) setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => { setStep((s) => Math.max(s - 1, 1)); };

  const finalizar = () => {
    if (seleccion.autores.length !== MAX_AUTORES) {
      alert(`Debes seleccionar ${MAX_AUTORES} autores.`);
      return;
    }
    onFinish(seleccion.libros, seleccion.generos, seleccion.autores);
    close();
  };

  // --- Función auxiliar para renderizar el ítem ---
  const renderItem = (item, tipo, max, isSelected, clickHandler) => {
    const isBook = tipo === 'libros';
    const isGenre = tipo === 'generos';
    const classType = isBook ? 'grid-item libro' : isGenre ? 'grid-item genero' : 'grid-item autor';

    const value = isBook ? item.titulo : item.nombre;

    const style = isGenre ? { backgroundColor: '#f2f7ff' } : isBook ? { backgroundColor: '#fff' } : { backgroundColor: item.color || '#fff' };

    return (
      <div
        key={value}
        className={`${classType} ${isSelected ? "activo" : ""}`}
        style={style}
        onClick={clickHandler}
      >
        {isSelected && <div className="check-mark">✔️</div>}

        {isBook && <img src={item.img} alt={value} />}
        {isGenre && <div className="genre-icon">{item.icono || '📚'}</div>}

        <p className="item-title">{value}</p>

        {isGenre && <div className="genre-text">Género</div>}
        {tipo === 'autores' && <div className="autor-tag">Autor</div>}
      </div>
    );
  };

  const currentMax = step === 1 ? MAX_LIBROS : step === 2 ? MAX_GENEROS : MAX_AUTORES;
  const currentCount = step === 1 ? seleccion.libros.length : step === 2 ? seleccion.generos.length : seleccion.autores.length;
  const currentTitle = step === 1 ? 'libros' : step === 2 ? 'géneros' : 'autores';

  return (
    <Modal openModal={open} closeModal={close} extraClass="modal-gustos">
      <div className="gustos-wrapper">
        <h1 className="main-title">Dejanos conocerte</h1>
        <h2 className="step-title">Seleccioná {currentMax} {currentTitle}</h2>
        <p className="selection-count">
          Llevas <strong>{currentCount}</strong> / {currentMax} seleccionados
        </p>

        <div className="gustos-grid">
          {step === 1 && librosEjemplo.map((libro) => {
            const isSelected = seleccion.libros.includes(libro.titulo);
            return renderItem(
              libro,
              "libros",
              MAX_LIBROS,
              isSelected,
              () => toggleSeleccion("libros", libro.titulo, MAX_LIBROS)
            );
          })}

          {step === 2 && generosEjemplo.map((genero) => {
            const isSelected = seleccion.generos.includes(genero.nombre);
            return renderItem(
              genero,
              "generos",
              MAX_GENEROS,
              isSelected,
              () => toggleSeleccion("generos", genero.nombre, MAX_GENEROS)
            );
          })}

          {step === 3 && autoresEjemplo.map((autor) => {
            const isSelected = seleccion.autores.includes(autor.nombre);
            return renderItem(
              autor,
              "autores",
              MAX_AUTORES,
              isSelected,
              () => toggleSeleccion("autores", autor.nombre, MAX_AUTORES)
            );
          })}
        </div>

        <div className="buttons-nav">
          {step > 1 && (
            <button className="btn back" onClick={prevStep}>← Atrás</button>
          )}

          {step < 3 ? (
            <button className={`btn blue ${currentCount !== currentMax ? 'disabled' : ''}`} onClick={nextStep} disabled={currentCount !== currentMax}>
              Siguiente →
            </button>
          ) : (
            <button className={`btn blue ${currentCount !== MAX_AUTORES ? 'disabled' : ''}`} onClick={finalizar} disabled={currentCount !== MAX_AUTORES}>
              Finalizar ✔
            </button>
          )}
        </div>

        <div className="dots">
          <span className={step === 1 ? "active" : ""}></span>
          <span className={step === 2 ? "active" : ""}></span>
          <span className={step === 3 ? "active" : ""}></span>
        </div>
      </div>

      {/* --- ESTILOS CSS MÁS ANCHOS --- */}
      <style>{`
        .gustos-wrapper {
          background-color: #e6eef6;
          border-radius: 10px;
          padding: 30px;
          width: 650px;
          max-width: 1080px;
          height: 650px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }


        .main-title {
          font-family: 'Codec Pro', sans-serif;
          color: #1a2a42;
          font-size: 24px;
          margin-bottom: 8px;
        }

        .step-title {
          text-align: center;
          color: #1a2a42;
          font-size: 32px;
          margin-bottom: 15px;
        }

        .selection-count {
          color: #555;
          font-size: 16px;
          margin-bottom: 20px;
        }

        .selection-count strong {
          font-weight: 700;
          color: #1a2a42;
        }


        .gustos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 17px;
          margin-bottom: 15px;
          width: 100%;
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          background-color: #f7faff;
          border-radius: 8px;
          scroll-behavior: smooth;
        }


        .grid-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fff;
          border-radius: 10px;
          padding: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s;
          position: relative;
          min-height: 140px;
          border: 1px solid #e0e0e0;
        }

        .grid-item:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .grid-item.activo {
          border: 3px solid #88c9f2;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .check-mark {
          position: absolute;
          top: 8px;
          right: 8px;
          font-size: 18px;
          color: #88c9f2;
          background: white;
          border-radius: 50%;
          padding: 3px;
        }

        /* Libros */
        .grid-item.libro img {
          width: 70px;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .grid-item.libro .item-title {
          font-size: 13px;
          font-weight: 600;
          color: #333;
          line-height: 1.3;
          margin: 0;
        }

        /* Géneros */
        .grid-item.genero .genre-icon {
          font-size: 28px;
          margin-bottom: 6px;
        }

        .grid-item.genero .item-title {
          font-weight: 700;
          font-size: 14px;
          margin: 0;
        }

        .genre-text {
          font-size: 11px;
          color: #666;
          margin-top: 3px;
        }

        /* Autores */
        .grid-item.autor {
          color: #1a2a42;
          padding-top: 25px;
        }

        .grid-item.autor .item-title {
          font-weight: 600;
          font-size: 14px;
          margin: 0;
          line-height: 1.3;
        }

        .autor-tag {
          font-size: 11px;
          color: #fff;
          background-color: rgba(0,0,0,0.2);
          padding: 3px 8px;
          border-radius: 4px;
          position: absolute;
          top: 8px;
          left: 8px;
        }

        /* Navegacion */
        .buttons-nav {
          display: flex;
          justify-content: space-between;
          width: 80%;
          max-width: 500px;
          margin-top: 10px;
        }

        .btn {
          padding: 10px 25px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
          font-weight: 600;
          font-size: 16px;
        }

        .btn.back {
          background: #adb5bd;
          color: white;
        }

        .btn.blue {
          background: #88c9f2;
          color: #1a2a42;
        }

        .btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn:hover:not(.disabled) {
          opacity: 0.9;
        }

        .dots {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .dots span {
          width: 12px;
          height: 12px;
          background: #b0b0b0;
          border-radius: 50%;
        }

        .dots .active {
          background: #88c9f2;
        }

        /* --- Responsive (para pantallas más chicas) --- */
        @media (max-width: 768px) {
          .gustos-wrapper {
            width: 95vw;
            height: 90vh;
            padding: 15px;
          }

          .gustos-grid {
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
          }

          .step-title {
            font-size: 24px;
          }
        }
      `}</style>


    </Modal>
  );
}