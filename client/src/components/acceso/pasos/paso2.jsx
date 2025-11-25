// src/components/RegisterSteps/Step2.jsx
import axios from "axios";

export const Step2 = ({ form, errors, onChange, next, back }) => {
  const handleUsernameChange = async (e) => {
    const newUsername = e.target.value;
    onChange(e);

    // Check if username exists in database if user has typed something
    if (newUsername && newUsername.length >= 3) {
      try {
        const response = await axios.get(
          `http://localhost:3000/nextread/check-username?usuario=${encodeURIComponent(newUsername)}`
        );
        if (response.data.exists) {
          // Username already exists - set error
          errors.usuario = "Este nombre de usuario ya está en uso";
        } else {
          // Username available - clear error if it was there
          if (errors.usuario && errors.usuario === "Este nombre de usuario ya está en uso") {
            delete errors.usuario;
          }
        }
      } catch (error) {
        console.error("Error al verificar usuario:", error);
      }
    }
  };

  const handleBirthDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      errors.nacimiento = "La fecha de nacimiento no puede ser posterior a hoy";
    } else {
      if (errors.nacimiento === "La fecha de nacimiento no puede ser posterior a hoy") {
        delete errors.nacimiento;
      }
    }
    onChange(e);
  };

  // Check if all fields are valid and step can progress
  const canProceed = () => {
    return (
      form.nombre &&
      form.apellido &&
      form.usuario &&
      form.nacimiento &&
      !errors.nombre &&
      !errors.apellido &&
      !errors.usuario &&
      !errors.nacimiento &&
      form.usuario.length >= 3
    );
  };

  return (
    <div className="step">
      <h2>Crea tu usuario</h2>

      <input
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={onChange}
        className={errors.nombre ? "input-error" : ""}
      />
      {errors.nombre && <p className="error-message">{errors.nombre}</p>}

      <input
        name="apellido"
        placeholder="Apellido"
        value={form.apellido}
        onChange={onChange}
        className={errors.apellido ? "input-error" : ""}
      />
      {errors.apellido && <p className="error-message">{errors.apellido}</p>}

      <input
        name="usuario"
        placeholder="UserName"
        value={form.usuario}
        onChange={handleUsernameChange}
        className={errors.usuario ? "input-error" : ""}
      />
      {errors.usuario && <p className="error-message">{errors.usuario}</p>}

      <input
        type="date"
        name="nacimiento"
        value={form.nacimiento}
        onChange={handleBirthDateChange}
        className={errors.nacimiento ? "input-error" : ""}
      />
      {errors.nacimiento && <p className="error-message">{errors.nacimiento}</p>}

      <div className="buttons">
        <button className="btn-modal" onClick={back}>
          ← Atrás
        </button>
        <button 
          className="btn-modal" 
          onClick={next}
          disabled={!canProceed()}
          style={{ opacity: canProceed() ? 1 : 0.5, cursor: canProceed() ? "pointer" : "not-allowed" }}
        >
          Siguiente ➜
        </button>
      </div>
    </div>
  );
};
