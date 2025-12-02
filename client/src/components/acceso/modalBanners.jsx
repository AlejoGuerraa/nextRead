import React, { useState, useEffect } from "react";
import { Modal } from "./modal";
import axios from "axios";

const DEFAULT_BANNER_URL = "/banners/bannerBiblioteca.jpg"; // fallback

export function ModalGustos({ open, close, onFinish, onBack }) {
  const [bannerOptions, setBannerOptions] = useState([]);
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [errorBanners, setErrorBanners] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/nextread/banners");
        // res.data expected: [{ id, url }, ...]
        setBannerOptions((res.data || []).slice(0, 5));
      } catch (err) {
        console.error("Error cargando banners:", err);
        setBannerOptions([]);
      } finally {
        setLoading(false);
      }
    };

    if (open) fetchBanners();
  }, [open]);

  const handleImageError = (id) => {
    setErrorBanners((prev) => ({ ...prev, [id]: true }));
  };

  const finalizar = async () => {
    // prioridad: url válida > default
    const finalBanner = selectedBanner || null;
    const finalBannerUrl = finalBanner && !errorBanners[finalBanner.id] ? finalBanner.url : DEFAULT_BANNER_URL;

    // Intentar guardar en backend si hay token
    try {
      const token = localStorage.getItem("token");
      if (token && finalBanner) {
        await axios.patch(
          "http://localhost:3000/nextread/user/editar",
          { banner: finalBannerUrl },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error("Error guardando banner en el servidor:", err);
    }

    onFinish(finalBannerUrl);
    close();
  };

  if (!open) return null;

  return (
    <Modal openModal={open} closeModal={close} extraClass="modal-gustos">
      <div className="gustos-wrapper onboarding-content">
        <h1 className="main-title">Último Paso:</h1>
        <h2 className="step-title">Seleccioná un banner para tu perfil</h2>
        <p className="selection-count">Si no elegís uno, usaremos un banner predeterminado.</p>

        <div className="gustos-grid banner-grid">
          {loading ? (
            <div>Cargando banners…</div>
          ) : (
            bannerOptions.map((banner) => {
              const isSelected = selectedBanner?.id === banner.id;
              const handleBannerClick = () => setSelectedBanner(isSelected ? null : banner);

              const useColor = errorBanners[banner.id] || !banner.url;
              const backgroundStyle = useColor
                ? { backgroundColor: "#dddddd" }
                : {
                    backgroundImage: `url(${banner.url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  };

              return (
                <button
                  key={banner.id}
                  type="button"
                  className={`grid-item banner-item ${isSelected ? "activo" : ""}`}
                  onClick={handleBannerClick}
                  aria-pressed={isSelected}
                  title={banner.url}
                >
                  <div className="banner-preview" style={backgroundStyle}>
                    {!useColor && (
                      <img
                        src={banner.url}
                        alt={`Banner ${banner.id}`}
                        onError={() => handleImageError(banner.id)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                      />
                    )}
                    {isSelected && <div className="check-mark">✔️</div>}
                  </div>

                </button>
              );
            })
          )}
        </div>

        <div className="buttons-nav" style={{ marginTop: 18, display: "flex", justifyContent: "center", gap: 16 }}>
          <button className="btn-back" onClick={onBack}>← Atrás</button>
          <button className="btn-finish" onClick={finalizar}>Finalizar Registro ✔</button>
        </div>

        <div className="dots" style={{ visibility: "hidden" }}>
          <span className="active"></span>
        </div>
      </div>
    </Modal>
  );
}
