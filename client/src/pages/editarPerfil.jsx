import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/header";
import "../pagescss/editarPerfil.css";

// Lista completa de géneros
const GENEROS_DISPONIBLES = [
  "Novela", "Existencialismo", "Ficción", "Experimental", "Cuento", "Surrealismo", "Absurdo", "Ficción Fantástica", "Fantástico", "Narrativa Breve", "Drama", "Novela Corta", "Música", "Jazz", "Aislamiento", "Psicológico", "Historia Argentina", "Apocalipsis", "Metafísico", "Romance", "Política", "Crítica Social", "Poesía", "Amor", "Realismo Mágico", "Periodismo", "Pobreza", "Reportaje", "Supervivencia", "No Ficción", "Crónica", "Matrimonio", "Clásico", "Sociedad", "Comedia", "Metafísica", "Filosófico", "Laberintos", "Ensayo/Cuento", "Creación", "Ensayo", "Crítica", "Cuento/Ensayo", "Sueños", "Alienación", "Burocracia", "Poder", "Investigación", "Policial", "Aventura", "Sobrenatural", "Gótico", "Dinosaurios", "Ciencia Ficción", "Enfermedad", "Alegoría", "Filosofía", "Guerra Civil", "Histórico", "Postguerra", "Fantasía", "Épico", "Misticismo", "Dictadura", "Feminismo", "Autobiografía", "Teatro", "Pasión", "Tragedia", "Cultura", "Represión", "Sátira", "Didáctico", "Memorias", "Horror", "Terror"
];

const EditarPerfil = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [banners, setBanners] = useState([]);
  const [iconos, setIconos] = useState([]);
  const [autores, setAutores] = useState([]);
  const [libros, setLibros] = useState([]);

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

  // Estados para sugerencias
  const [sugerenciasAutor, setSugerenciasAutor] = useState([]);
  const [sugerenciasGenero, setSugerenciasGenero] = useState([]);
  const [sugerenciasTitulo, setSugerenciasTitulo] = useState([]);
  const [mostrarSugerenciasAutor, setMostrarSugerenciasAutor] = useState(false);
  const [mostrarSugerenciasGenero, setMostrarSugerenciasGenero] = useState(false);
  const [mostrarSugerenciasTitulo, setMostrarSugerenciasTitulo] = useState(false);

  // Rastrear si hay una selección válida para cada campo
  const [seleccionValidaAutor, setSeleccionValidaAutor] = useState(false);
  const [seleccionValidaGenero, setSeleccionValidaGenero] = useState(false);
  const [seleccionValidaTitulo, setSeleccionValidaTitulo] = useState(false);
  const [erroresValidacion, setErroresValidacion] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/acceso");
      return;
    }

    // Fetch user data, banners, iconos, autores, and libros in parallel
    Promise.all([
      axios.get("http://localhost:3000/nextread/user", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get("http://localhost:3000/nextread/banners"),
      axios.get("http://localhost:3000/nextread/iconos"),
      axios.get("http://localhost:3000/nextread/autores"),
      axios.get("http://localhost:3000/nextread/libros")
    ])
      .then(([userRes, bannersRes, iconosRes, autoresRes, librosRes]) => {
        const userData = userRes.data;
        setUser(userData);
        setBanners(bannersRes.data);
        setIconos(iconosRes.data);
        setAutores(autoresRes.data);
        setLibros(librosRes.data);

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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Filtrar sugerencias según el tipo de campo
    if (name === "autor_preferido") {
      setSeleccionValidaAutor(false); // marcar como no validada mientras escribe
      if (value.trim().length > 0) {
        const filtered = autores.filter(a =>
          a.nombre.toLowerCase().includes(value.toLowerCase())
        );
        setSugerenciasAutor(filtered.slice(0, 8)); // máximo 8 sugerencias
        setMostrarSugerenciasAutor(true);
      } else {
        setSugerenciasAutor([]);
        setMostrarSugerenciasAutor(false);
      }
    } else if (name === "genero_preferido") {
      setSeleccionValidaGenero(false); // marcar como no validada mientras escribe
      if (value.trim().length > 0) {
        const filtered = GENEROS_DISPONIBLES.filter(g =>
          g.toLowerCase().includes(value.toLowerCase())
        );
        setSugerenciasGenero(filtered.slice(0, 8)); // máximo 8 sugerencias
        setMostrarSugerenciasGenero(true);
      } else {
        setSugerenciasGenero([]);
        setMostrarSugerenciasGenero(false);
      }
    } else if (name === "titulo_preferido") {
      setSeleccionValidaTitulo(false); // marcar como no validada mientras escribe
      if (value.trim().length > 0) {
        const filtered = libros.filter(l =>
          l.titulo.toLowerCase().includes(value.toLowerCase())
        );
        setSugerenciasTitulo(filtered.slice(0, 8)); // máximo 8 sugerencias
        setMostrarSugerenciasTitulo(true);
      } else {
        setSugerenciasTitulo([]);
        setMostrarSugerenciasTitulo(false);
      }
    }
  };

  const handleSelectSuggestion = (field, value) => {
    // Actualizar el campo con el valor seleccionado
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    if (field === "autor_preferido") {
      setMostrarSugerenciasAutor(false);
      setSeleccionValidaAutor(true); // marcar como validada
    } else if (field === "genero_preferido") {
      setMostrarSugerenciasGenero(false);
      setSeleccionValidaGenero(true); // marcar como validada
    } else if (field === "titulo_preferido") {
      setMostrarSugerenciasTitulo(false);
      setSeleccionValidaTitulo(true); // marcar como validada
    }
  };

  const handleBlurAutor = () => {
    setMostrarSugerenciasAutor(false);
    // Si el texto no es válido, limpiar
    if (!seleccionValidaAutor && formData.autor_preferido.trim().length > 0) {
      const isValid = autores.some(a => a.nombre === formData.autor_preferido.trim());
      if (!isValid) {
        setFormData({ ...formData, autor_preferido: "" });
        setErroresValidacion([]); // Limpiar errores al limpiar el campo
      }
    }
  };

  const handleBlurGenero = () => {
    setMostrarSugerenciasGenero(false);
    // Si el texto no es válido, limpiar
    if (!seleccionValidaGenero && formData.genero_preferido.trim().length > 0) {
      const isValid = GENEROS_DISPONIBLES.includes(formData.genero_preferido.trim());
      if (!isValid) {
        setFormData({ ...formData, genero_preferido: "" });
        setErroresValidacion([]); // Limpiar errores al limpiar el campo
      }
    }
  };

  const handleBlurTitulo = () => {
    setMostrarSugerenciasTitulo(false);
    // Si el texto no es válido, limpiar
    if (!seleccionValidaTitulo && formData.titulo_preferido.trim().length > 0) {
      const isValid = libros.some(l => l.titulo === formData.titulo_preferido.trim());
      if (!isValid) {
        setFormData({ ...formData, titulo_preferido: "" });
        setErroresValidacion([]); // Limpiar errores al limpiar el campo
      }
    }
  };

  const handleBannerSelect = (bannerId) => {
    setFormData({ ...formData, idBanner: bannerId });
  };

  const handleIconSelect = (iconoId) => {
    setFormData({ ...formData, idIcono: iconoId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar que los campos preferidos sean válidos (si están rellenos)
    const errores = [];

    if (formData.autor_preferido.trim().length > 0) {
      const isValid = autores.some(a => a.nombre === formData.autor_preferido.trim());
      if (!isValid) {
        errores.push("Debes elegir un autor válido de la lista de sugerencias");
      }
    }

    if (formData.genero_preferido.trim().length > 0) {
      const isValid = GENEROS_DISPONIBLES.includes(formData.genero_preferido.trim());
      if (!isValid) {
        errores.push("Debes elegir un género válido de la lista de sugerencias");
      }
    }

    if (formData.titulo_preferido.trim().length > 0) {
      const isValid = libros.some(l => l.titulo === formData.titulo_preferido.trim());
      if (!isValid) {
        errores.push("Debes elegir un título válido de la lista de sugerencias");
      }
    }

    // Si hay errores, mostrarlos y no enviar
    if (errores.length > 0) {
      setErroresValidacion(errores);
      return;
    }

    // Limpiar errores si todo es válido
    setErroresValidacion([]);

    const token = localStorage.getItem("token");

    // Build payload
    const payload = {
      nombre: formData.nombre,
      apellido: formData.apellido,
      descripcion: formData.descripcion,
      autor_preferido: formData.autor_preferido,
      genero_preferido: formData.genero_preferido,
      titulo_preferido: formData.titulo_preferido
    };

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
        // No mostrar alert, solo navegar
        navigate("/perfil");
      })
      .catch((err) => {
        console.error("Error:", err);
        setErroresValidacion(["Hubo un error al actualizar el perfil."]);
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

        {erroresValidacion.length > 0 && (
          <div className="error-box">
            {erroresValidacion.map((error, index) => (
              <div key={index} className="error-message">
                ⚠️ {error}
              </div>
            ))}
          </div>
        )}

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
              <input
                type="text"
                name="autor_preferido"
                value={formData.autor_preferido}
                onChange={handleChange}
                onFocus={() => formData.autor_preferido.trim().length > 0 && setMostrarSugerenciasAutor(true)}
                onBlur={handleBlurAutor}
              />
              {mostrarSugerenciasAutor && sugerenciasAutor.length > 0 && (
                <div className="suggestions-dropdown">
                  {sugerenciasAutor.map((autor) => (
                    <div
                      key={autor.id}
                      className="suggestion-item"
                      onMouseDown={() => handleSelectSuggestion("autor_preferido", autor.nombre)}
                    >
                      {autor.nombre}
                    </div>
                  ))}
                </div>
              )}
            </label>

            <label>
              Género preferido:
              <input
                type="text"
                name="genero_preferido"
                value={formData.genero_preferido}
                onChange={handleChange}
                onFocus={() => formData.genero_preferido.trim().length > 0 && setMostrarSugerenciasGenero(true)}
                onBlur={handleBlurGenero}
              />
              {mostrarSugerenciasGenero && sugerenciasGenero.length > 0 && (
                <div className="suggestions-dropdown">
                  {sugerenciasGenero.map((genero, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onMouseDown={() => handleSelectSuggestion("genero_preferido", genero)}
                    >
                      {genero}
                    </div>
                  ))}
                </div>
              )}
            </label>

            <label>
              Título preferido:
              <input
                type="text"
                name="titulo_preferido"
                value={formData.titulo_preferido}
                onChange={handleChange}
                onFocus={() => formData.titulo_preferido.trim().length > 0 && setMostrarSugerenciasTitulo(true)}
                onBlur={handleBlurTitulo}
              />
              {mostrarSugerenciasTitulo && sugerenciasTitulo.length > 0 && (
                <div className="suggestions-dropdown">
                  {sugerenciasTitulo.map((libro) => (
                    <div
                      key={libro.id}
                      className="suggestion-item"
                      onMouseDown={() => handleSelectSuggestion("titulo_preferido", libro.titulo)}
                    >
                      {libro.titulo}
                    </div>
                  ))}
                </div>
              )}
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
