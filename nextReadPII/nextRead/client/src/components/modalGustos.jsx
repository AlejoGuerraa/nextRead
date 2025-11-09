import React, { useState } from "react";
import { Modal } from "../components/modal";

const DEFAULT_BANNER_URL = "default-banner-url.jpg"; 

export function ModalGustos({ open, close, onFinish, onBack }) { 
  const bannerOptions = [
    { name: "Bosque Magico", url: "", color: "#6e8b79" },
    { name: "Cielo Estrellado", url: "", color: "#36454F" },
    { name: "Biblioteca Antigua", url: "", color: "#927057" },
    { name: "Cafe y Lectura", url: "", color: "#C68E17" },
    { name: "Minimalista Azul", url: "", color: "#406882" },
  ];

  const [selectedBanner, setSelectedBanner] = useState(null);

  const finalizar = () => {
    const finalBannerUrl = selectedBanner ? selectedBanner.url : DEFAULT_BANNER_URL;
    onFinish(finalBannerUrl);
    close();
  };

  return (
    <Modal openModal={open} closeModal={close} extraClass="modal-gustos">
      <div className="gustos-wrapper">
        <h1 className="main-title">Último Paso: </h1>
        <h2 className="step-title">Selecciona un banner para tu perfil</h2>
        <p className="selection-count">
          Si no elegís uno, usaremos un banner predeterminado.
        </p>

        <div className="gustos-grid banner-grid">
          {bannerOptions.map((banner) => {
            const isSelected = selectedBanner && selectedBanner.name === banner.name;

            const handleBannerClick = () => {
              if (isSelected) {
                // Deseleccionar
                setSelectedBanner(null);
              } else {
                // Seleccionar
                setSelectedBanner(banner);
              }
            };

            return (
              <div
                key={banner.name}
                className={`grid-item banner-item ${isSelected ? "activo" : ""}`}
                style={banner.url.startsWith('#') ? { backgroundColor: banner.url } : { backgroundImage: `url(${banner.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                onClick={handleBannerClick}
              >
                {isSelected && <div className="check-mark">✔️</div>}

                <div
                  className="banner-preview"
                  style={banner.url.startsWith('#') ? { backgroundColor: banner.url } : { backgroundImage: `url(${banner.url})` }}
                >
                </div>

                <p className="item-title">{banner.name}</p>
              </div>
            );
          })}
        </div>

        <div className="buttons-nav">
          <button className="btn-back" onClick={onBack}>
            ← Atrás
          </button>
          
          <button
            className="btn-finish"
            onClick={finalizar}
          >
            Finalizar Registro ✔
          </button>
        </div>

        <div className="dots" style={{ visibility: 'hidden' }}><span className="active"></span></div>
      </div>


      <style>{`
        /* ... Estilos que no cambian (gustos-wrapper, main-title, step-title, selection-count, gustos-grid, grid-item, etc.) ... */

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

        /* Estilos específicos para los banners */
        .grid-item.banner-item {
          min-height: 180px;
          justify-content: space-around;
        }
        
        .banner-preview {
          width: 100%;
          height: 120px;
          border-radius: 6px;
          margin-bottom: 2px;
          background-size: cover;
          background-position: center;
          background-color: #f0f0f0; 
        }
        
        .item-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
          margin-top: -1px;
        }
        
        /* Navegacion: Separa los botones 'Atrás' y 'Finalizar' */
        .buttons-nav {
          display: flex;
          justify-content: space-between; 
          width: 80%;
          max-width: 500px;
          margin-top: 10px;
        }

        .btn-back, .btn-finish {
          padding: 10px 25px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
          font-weight: 600;
          font-size: 16px;
        }

        .btn-back:hover, .btn-finish:hover{
          opacity: 0.9;
        }
        
        .btn-finish, .btn-back{
          background: #f7b731; /* Un amarillo brillante/cálido */
          color: #1a2a42; /* Texto oscuro */
        }


        /* Los puntos de navegación están ocultos */
        .dots {
          visibility: hidden; 
          height: 0;
          overflow: hidden;
        }

        /* Responsive */
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