import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import "../pagescss/editarPerfil.css";

const EditarPerfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [banners, setBanners] = useState([]);
  const [iconos, setIconos] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    descripcion: "",
    autor_preferido: "",
    genero_preferido: "",
    titulo_preferido: "",
    idBanner: null,
    idIcono: null
  });

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/acceso");
      return;
    }

    // Fetch user data, banners, and iconos in parallel
    Promise.all([
      axios.get("http://localhost:3000/nextread/user", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:3000/nextread/banners"),
      axios.get("http://localhost:3000/nextread/iconos")
    ])
      .then(([userRes, bannersRes, iconosRes]) => {
        const userData = userRes.data;
        setUser(userData);
        setBanners(bannersRes.data);
        setIconos(iconosRes.data);

        // Parse JSON arrays safely
        const parseArray = (value) => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          try {
            return JSON.parse(value);
          } catch {
            return [];
          }
        };

        const iconosObtenidos = parseArray(userData.iconos_obtenidos);
        const bannersObtenidos = parseArray(userData.banners_obtenidos);

        setFormData({
          nombre: userData.nombre || "",
          apellido: userData.apellido || "",
          descripcion: userData.descripcion || "",
          autor_preferido: userData.autor_preferido || "",
          genero_preferido: userData.genero_preferido || "",
          titulo_preferido: userData.titulo_preferido || "",
          idBanner: userData.idBanner || null,
          idIcono: userData.idIcono || null
        });

        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener los datos:", err);
        setLoading(false);
      });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBannerSelect = (bannerId) => {
    setFormData({ ...formData, idBanner: bannerId });
  };

  const handleIconSelect = (iconoId) => {
    setFormData({ ...formData, idIcono: iconoId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = JSON.parse(localStorage.getItem("user"))?.token;

    // Build payload: include only idBanner and idIcono (server will ignore if null)
    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      descripcion: formData.descripcion,
      autor_preferido: formData.autor_preferido,
      genero_preferido: formData.genero_preferido,
      titulo_preferido: formData.titulo_preferido
    };

    // Send banner and icon data directly as ids (server expects id references or URL/symbol)
    // Actually, check the backend: it expects banner (URL) and icono (symbol path)
    // So we need to map ids back to the URL/symbol values

    if (formData.idBanner) {
      const selectedBanner = banners.find(b => b.id === formData.idBanner);
      if (selectedBanner) {
        payload.banner = selectedBanner.url;
      }
    }

    if (formData.idIcono) {
      const selectedIcon = iconos.find(i => i.id === formData.idIcono);
      if (selectedIcon) {
        payload.icono = selectedIcon.simbolo;
      }
    }

    axios
      .patch("http://localhost:3000/nextread/user/editar", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Perfil actualizado con éxito");
        navigate("/perfil");
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("Hubo un error al actualizar el perfil.");
      });
  };

  if (loading) return <div className="center">Cargando datos del usuario...</div>;

  // Helper to get user's obtained lists
  const parseArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  };

  const userIconosObtenidos = user ? parseArray(user.iconos_obtenidos) : [];
  const userBannersObtenidos = user ? parseArray(user.banners_obtenidos) : [];

  // Filter: only show iconos/banners the user has obtained
  const availableIconos = iconos.filter(i => userIconosObtenidos.includes(i.id));
  const availableBanners = banners.filter(b => userBannersObtenidos.includes(b.id));

  return (
    <>
      <Header />

      <div className="editar-perfil-page">
        <h1>Editar Perfil</h1>

        <form onSubmit={handleSubmit} className="editar-form">
          
          {/* ====================== DATOS PERSONALES ====================== */}
          <fieldset className="form-section dark-section">
            <legend>Datos personales</legend>

            <label>
              Nombre:
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} />
            </label>

            <label>
              Apellido:
              <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} />
            </label>

            <label>
              Descripción:
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}></textarea>
            </label>
          </fieldset>

          {/* ====================== PREFERENCIAS ====================== */}
          <fieldset className="form-section dark-section">
            <legend>Preferencias de lectura</legend>

            <label>
              Autor preferido:
              <input type="text" name="autor_preferido" value={formData.autor_preferido} onChange={handleChange} />
            </label>

            <label>
              Género preferido:
              <input type="text" name="genero_preferido" value={formData.genero_preferido} onChange={handleChange} />
            </label>

            <label>
              Título preferido:
              <input type="text" name="titulo_preferido" value={formData.titulo_preferido} onChange={handleChange} />
            </label>
          </fieldset>

          {/* ====================== ESTÉTICA ====================== */}
          <fieldset className="form-section dark-section">
            <legend>Estética</legend>

            {/* ===== SELECTOR DE BANNERS ===== */}
            <p>Elegir banner:</p>
            {availableBanners.length > 0 ? (
              <div className="banner-selector">
                {availableBanners.map((b) => (
                  <img
                    key={b.id}
                    src={b.url}
                    alt={`banner-${b.id}`}
                    className={`banner-option ${formData.idBanner === b.id ? "selected-banner" : ""}`}
                    onClick={() => handleBannerSelect(b.id)}
                    title={`Banner ${b.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="no-items">No tienes banners disponibles</p>
            )}

            {/* ===== SELECTOR DE ICONOS ===== */}
            <p>Elegir icono:</p>
            {availableIconos.length > 0 ? (
              <div className="avatar-selector">
                {availableIconos.map((i) => (
                  <img
                    key={i.id}
                    src={i.simbolo}
                    alt={`icono-${i.id}`}
                    className={`avatar-option ${formData.idIcono === i.id ? "selected-avatar" : ""}`}
                    onClick={() => handleIconSelect(i.id)}
                    title={`Icono ${i.id}`}
                  />
                ))}
              </div>
            ) : (
              <p className="no-items">No tienes iconos disponibles</p>
            )}

          </fieldset>

          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar cambios</button>
            <button type="button" className="btn-outline" onClick={() => navigate("/perfil")}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditarPerfil;
