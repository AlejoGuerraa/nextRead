import React, { useState } from "react";
import { Modal } from "../components/modal";

export function ModalGustos({ open, close, onFinish }) {
  const [step, setStep] = useState(1);
  const [seleccion, setSeleccion] = useState({ libros: [], generos: [], autores: [] });
  const [index, setIndex] = useState(0);

  const librosEjemplo = [
    { titulo: "1984", img: "/libros/1984.jpg" },
    { titulo: "Orgullo y prejuicio", img: "/libros/orgullo.jpg" },
    { titulo: "Harry Potter", img: "/libros/hp.jpg" },
    { titulo: "El señor de los anillos", img: "/libros/lotr.jpg" },
    { titulo: "Cien años de soledad", img: "/libros/cien.jpg" },
    { titulo: "El principito", img: "/libros/principito.jpg" },
    { titulo: "It", img: "/libros/it.jpg" },
    { titulo: "Los juegos del hambre", img: "/libros/hambre.jpg" },
  ];

  const generosEjemplo = ["Fantasía", "Ciencia ficción", "Romance", "Misterio", "Terror", "Aventura"];

  const autoresEjemplo = [
    { nombre: "Stephen King", color: "#a2d2ff" },
    { nombre: "Jane Austen", color: "#cdb4db" },
    { nombre: "J. K. Rowling", color: "#ffe066" },
    { nombre: "Gabriel García Márquez", color: "#ffc8dd" },
    { nombre: "Tolkien", color: "#bde0fe" },
    { nombre: "Agatha Christie", color: "#ffafcc" },
  ];

  const toggleSeleccion = (tipo, valor, max) => {
    setSeleccion((prev) => {
      const actual = prev[tipo];
      const existe = actual.includes(valor);
      if (existe) {
        return { ...prev, [tipo]: actual.filter((v) => v !== valor) };
      } else if (actual.length < max) {
        return { ...prev, [tipo]: [...actual, valor] };
      } else {
        return prev;
      }
    });
  };

  const nextStep = () => { setStep((s) => Math.min(s + 1, 3)); setIndex(0); };
  const prevStep = () => { setStep((s) => Math.max(s - 1, 1)); setIndex(0); };

  const prevItem = (array) => setIndex((i) => (i === 0 ? array.length - 1 : i - 1));
  const nextItem = (array) => setIndex((i) => (i === array.length - 1 ? 0 : i + 1));

  const finalizar = () => {
    // Validaciones antes de enviar
    if (seleccion.libros.length !== 5) {
      alert("Debes seleccionar 5 libros");
      return;
    }
    if (seleccion.generos.length !== 3) {
      alert("Debes seleccionar 3 géneros");
      return;
    }
    if (seleccion.autores.length !== 3) {
      alert("Debes seleccionar 3 autores");
      return;
    }
    onFinish(seleccion.libros, seleccion.generos, seleccion.autores);
    close();
  };

  return (
    <Modal openModal={open} closeModal={close}>
      <div className="gustos-wrapper">
        <h1 style={{ fontFamily: "'Codec Pro', sans-serif", color: '#1a2a42', fontSize: '22px', marginBottom: '10px' }}>
          Dejanos conocerte
        </h1>

        <div className="gustos-box">
          {step === 1 && (
            <>
              <h2>Seleccioná 5 libros</h2>
              <div className="carousel-box">
                <button className="arrow" onClick={() => prevItem(librosEjemplo)}>‹</button>
                <div
                  className={`item ${seleccion.libros.includes(librosEjemplo[index].titulo) ? "activo" : ""}`}
                  onClick={() => toggleSeleccion("libros", librosEjemplo[index].titulo, 5)}
                >
                  <img src={librosEjemplo[index].img} alt={librosEjemplo[index].titulo} />
                  <p>{librosEjemplo[index].titulo}</p>
                </div>
                <button className="arrow" onClick={() => nextItem(librosEjemplo)}>›</button>
              </div>
              <div className="buttons">
                <button className="btn blue" onClick={nextStep}>Siguiente</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Seleccioná 3 géneros</h2>
              <div className="carousel-box">
                <button className="arrow" onClick={() => prevItem(generosEjemplo)}>‹</button>
                <div
                  className={`genre ${seleccion.generos.includes(generosEjemplo[index]) ? "activo" : ""}`}
                  onClick={() => toggleSeleccion("generos", generosEjemplo[index], 3)}
                >
                  {generosEjemplo[index]}
                </div>
                <button className="arrow" onClick={() => nextItem(generosEjemplo)}>›</button>
              </div>
              <div className="buttons">
                <button className="btn" onClick={prevStep}>Atrás</button>
                <button className="btn blue" onClick={nextStep}>Siguiente</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Seleccioná 3 autores</h2>
              <div className="carousel-box">
                <button className="arrow" onClick={() => prevItem(autoresEjemplo)}>‹</button>
                <div
                  className={`autor ${seleccion.autores.includes(autoresEjemplo[index].nombre) ? "activo" : ""}`}
                  style={{ backgroundColor: autoresEjemplo[index].color }}
                  onClick={() => toggleSeleccion("autores", autoresEjemplo[index].nombre, 3)}
                >
                  <div className="icon">📚</div>
                  <p>{autoresEjemplo[index].nombre}</p>
                </div>
                <button className="arrow" onClick={() => nextItem(autoresEjemplo)}>›</button>
              </div>
              <div className="buttons">
                <button className="btn" onClick={prevStep}>Atrás</button>
                <button className="btn blue" onClick={finalizar}>Finalizar</button>
              </div>
            </>
          )}

          <div className="dots">
            <span className={step === 1 ? "active" : ""}></span>
            <span className={step === 2 ? "active" : ""}></span>
            <span className={step === 3 ? "active" : ""}></span>
          </div>
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .gustos-wrapper {
          background-color: #e6eef6;
          border-radius: 10px;
          padding: 25px;
          width: 500px;
          max-width: 90%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        h2 {
          text-align: center;
          color: #1a2a42;
          margin-bottom: 15px;
        }

        .carousel-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 10px 0 25px 0;
        }

        .arrow {
          font-size: 28px;
          background: none;
          border: none;
          cursor: pointer;
          color: #1a2a42;
          transition: transform 0.2s;
        }

        .arrow:hover {
          transform: scale(1.2);
        }

        .item, .genre, .autor {
          min-width: 180px;
          min-height: 180px;
          border-radius: 12px;
          background: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: all 0.3s;
          padding: 10px;
          text-align: center;
        }

        .item img {
          width: 120px;
          height: 160px;
          object-fit: cover;
          border-radius: 8px;
        }

        .item.activo, .genre.activo, .autor.activo {
          transform: scale(1.1);
          box-shadow: 0 8px 15px rgba(0,0,0,0.2);
          border: 2px solid #88c9f2;
        }

        .genre {
          font-weight: 600;
        }

        .autor .icon {
          font-size: 30px;
          margin-bottom: 8px;
        }

        .buttons {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 15px;
        }

        .btn {
          padding: 6px 14px;
          border: none;
          border-radius: 6px;
          background: #adb5bd;
          color: white;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn.blue {
          background: #88c9f2;
        }

        .btn:hover {
          opacity: 0.9;
        }

        .dots {
          margin-top: 12px;
          display: flex;
          gap: 6px;
          justify-content: center;
        }

        .dots span {
          width: 10px;
          height: 10px;
          background: #b0b0b0;
          border-radius: 50%;
        }

        .dots .active {
          background: #88c9f2;
        }
      `}</style>
    </Modal>
  );
}
