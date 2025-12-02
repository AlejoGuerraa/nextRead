// File: src/components/settings/ChangePassword.jsx
import React, { useState } from "react";
import axios from "axios";

export default function ChangePassword() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPwd !== confirmPwd) {
      setMessage({
        type: "error",
        text: "Las contraseñas nuevas no coinciden.",
      });
      return;
    }

    try {
      const res = await axios.patch(
        "http://localhost:3000/nextread/user/change-password",
        {
          currentPwd,
          newPwd,
        },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      setMessage({
        type: "info",
        text: res.data.msg || "Contraseña cambiada correctamente.",
      });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: error.response?.data?.error || "Error al cambiar la contraseña.",
      });
    }
  };

  return (
    <section className="config-section">
      <h3>Cambiar contraseña</h3>
      <form onSubmit={handleSubmit} className="config-form">
        <label>
          Contraseña actual
          <input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Nueva contraseña
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </label>

        <label>
          Confirmar nueva contraseña
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            Cambiar contraseña
          </button>
        </div>

        {message && (
          <p className={"info " + (message.type === "error" ? "error" : "")}>
            {message.text}
          </p>
        )}
      </form>
    </section>
  );
}
