// src/components/RegisterSteps/Step1.jsx
import axios from "axios";

export const Step1 = ({ form, errors, onChange, next, openLogin }) => {
  const handleEmailChange = async (e) => {
    const newEmail = e.target.value;
    onChange(e);

    // Check if email exists in database if user has typed something
    if (newEmail && newEmail.includes("@")) {
      try {
        const response = await axios.get(
          `http://localhost:3000/nextread/check-email?correo=${encodeURIComponent(newEmail)}`
        );
        if (response.data.exists) {
          // Email already exists - set error
          errors.correo = "Este email ya está registrado";
        } else {
          // Email available - clear error if it was there
          if (errors.correo && errors.correo === "Este email ya está registrado") {
            delete errors.correo;
          }
        }
      } catch (error) {
        console.error("Error al verificar email:", error);
      }
    }
  };

  // Check if all fields are valid and step can progress
  const canProceed = () => {
    return (
      form.correo &&
      form.contrasena &&
      form.repeatPassword &&
      !errors.correo &&
      !errors.contrasena &&
      !errors.repeatPassword &&
      form.correo.includes("@") &&
      form.contrasena.length >= 8 &&
      form.contrasena === form.repeatPassword
    );
  };

  return (
    <div className="step">
      <h2>Forma parte de NextRead</h2>

      <input
        type="email"
        name="correo"
        placeholder="Email"
        value={form.correo}
        onChange={handleEmailChange}
        className={errors.correo ? "input-error" : ""}
      />
      {errors.correo && <p className="error-message">{errors.correo}</p>}

      <input
        type="password"
        name="contrasena"
        placeholder="Contraseña"
        value={form.contrasena}
        onChange={onChange}
        className={errors.contrasena ? "input-error" : ""}
      />
      {errors.contrasena && <p className="error-message">{errors.contrasena}</p>}

      <input
        type="password"
        name="repeatPassword"
        placeholder="Repetir contraseña"
        value={form.repeatPassword}
        onChange={onChange}
        className={errors.repeatPassword ? "input-error" : ""}
      />
      {errors.repeatPassword && <p className="error-message">{errors.repeatPassword}</p>}

      <button 
        className="btn-modal next-btn" 
        onClick={next}
        disabled={!canProceed()}
        style={{ opacity: canProceed() ? 1 : 0.5, cursor: canProceed() ? "pointer" : "not-allowed" }}
      >
        Siguiente ➜
      </button>

      <span className="redirect-link" onClick={openLogin}>
        ¿Ya tenés cuenta? Inicia sesión
      </span>
    </div>
  );
};
