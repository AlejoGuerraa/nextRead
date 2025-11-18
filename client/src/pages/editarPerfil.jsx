import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import "../pagescss/editarPerfil.css";

const avatarOptions = [
  "/iconos/avLamparita.png",
  "/iconos/avLechuza.png",
  "/iconos/avLibroStar.png",
  "/iconos/avLupa.png",
];

const bannerOptions = [
  "/banners/bnAzulDegrade.jpg",
  "/banners/bnBlancoDegrade.jpeg",
  "/banners/bnVerdeDegrade.jpg",
  "/banners/bnVioletaDegrade.jpg",
];

const EditarPerfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    descripcion: "",
    autor_preferido: "",
    genero_preferido: "",
    titulo_preferido: "",
    banner: "",
    icono: ""
  });

  useEffect(() => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (!token) {
      navigate("/acceso");
      return;
    }

    axios
      .get("http://localhost:3000/nextread/user", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const data = res.data;
        setFormData({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          descripcion: data.descripcion || "",
          autor_preferido: data.autor_preferido || "",
          genero_preferido: data.genero_preferido || "",
          titulo_preferido: data.titulo_preferido || "",
          banner: data.banner || bannerOptions[0], // ← Default si es color
          icono: data.icono || ""
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al obtener los datos:", err);
        navigate("/acceso");
      });
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = JSON.parse(localStorage.getItem("user"))?.token;

    axios
      .patch("http://localhost:3000/nextread/user/editar", formData, {
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
            <div className="banner-selector">
              {bannerOptions.map((b) => (
                <img
                  key={b}
                  src={b}
                  alt="banner"
                  className={`banner-option ${formData.banner === b ? "selected-banner" : ""}`}
                  onClick={() => setFormData({ ...formData, banner: b })}
                />
              ))}
            </div>

            {/* ===== SELECTOR DE ICONOS ===== */}
            <p>Elegir icono:</p>
            <div className="avatar-selector">
              {avatarOptions.map((av) => (
                <img
                  key={av}
                  src={av}
                  alt="avatar"
                  className={`avatar-option ${formData.icono === av ? "selected-avatar" : ""}`}
                  onClick={() => setFormData({ ...formData, icono: av })}
                />
              ))}
            </div>

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
