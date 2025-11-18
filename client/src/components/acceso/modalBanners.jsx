import React, { useState } from "react";
import { Modal } from "./modal";

const DEFAULT_BANNER_URL = "/default-banner.jpg"; // ruta en /public

export function ModalGustos({ open, close, onFinish, onBack }) {
  const bannerOptions = [
    { name: "Bosque Mágico", url: "../banners/banner-bosque.jpg", color: "#6e8b79" },
    { name: "Cielo Estrellado", url: "../banners/banner-cielo.jpg", color: "#36454F" },
    { name: "Biblioteca Antigua", url: "../banners/banner-biblioteca.jpg", color: "#927057" },
    { name: "Café y Lectura", url: "../banners/banner-cafe.jpg", color: "#C68E17" },
    { name: "Minimalista Azul", url: "../banners/banner-azul.jpg", color: "#406882" },
  ];

  const [selectedBanner, setSelectedBanner] = useState(null);
  const [errorBanners, setErrorBanners] = useState({});

  const handleImageError = (name) => {
    // marca este banner como "con error", para usar color
    setErrorBanners((prev) => ({ ...prev, [name]: true }));
  };

  const finalizar = () => {
    // prioridad: url (válida) > color > default
    const finalBannerUrl =
      (selectedBanner && !errorBanners[selectedBanner.name] && selectedBanner.url) ||
      (selectedBanner && selectedBanner.color) ||
      DEFAULT_BANNER_URL;

    onFinish(finalBannerUrl);
    close();
  };

  return (
    <Modal openModal={open} closeModal={close} extraClass="modal-gustos">
      <div className="gustos-wrapper onboarding-content">
        <h1 className="main-title">Último Paso:</h1>
        <h2 className="step-title">Seleccioná un banner para tu perfil</h2>
        <p className="selection-count">
          Si no elegís uno, usaremos un banner predeterminado.
        </p>

        <div className="gustos-grid banner-grid">
          {bannerOptions.map((banner) => {
            const isSelected = selectedBanner?.name === banner.name;
            const handleBannerClick = () =>
              setSelectedBanner(isSelected ? null : banner);

            const useColor = errorBanners[banner.name] || !banner.url;
            const backgroundStyle = useColor
              ? { backgroundColor: banner.color }
              : {
                  backgroundImage: `url(${banner.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                };

            return (
              <button
                key={banner.name}
                type="button"
                className={`grid-item banner-item ${isSelected ? "activo" : ""}`}
                onClick={handleBannerClick}
                aria-pressed={isSelected}
                title={banner.name}
              >
                <div className="banner-preview" style={backgroundStyle}>
                  {!useColor && (
                    <img
                      src={banner.url}
                      alt={banner.name}
                      onError={() => handleImageError(banner.name)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "inherit",
                      }}
                    />
                  )}
                  {isSelected && <div className="check-mark">✔️</div>}
                </div>

                <p className="item-title">{banner.name}</p>
              </button>
            );
          })}
        </div>

        <div className="buttons-nav" style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 16 }}>
          <button className="btn-back" onClick={onBack}>
            ← Atrás
          </button>

          <button className="btn-finish" onClick={finalizar}>
            Finalizar Registro ✔
          </button>
        </div>

        <div className="dots" style={{ visibility: "hidden" }}>
          <span className="active"></span>
        </div>
      </div>
    </Modal>
  );
}
