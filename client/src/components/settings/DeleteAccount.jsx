// File: src/components/settings/DeleteAccount.jsx
import React, { useState } from 'react';
import axios from "axios";

export default function DeleteAccount() {
  const [confirmText, setConfirmText] = useState("");
  const [message, setMessage] = useState(null);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmText !== "ELIMINAR") return;

    try {
      const res = await axios.post(
        "http://localhost:3000/nextread/user/delete-account-request",
        {},
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      setMessage({ type: "info", text: res.data.msg });

    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Error solicitando eliminación.",
      });
    }
  };

  return (
    <section className="config-section danger">
      <h3>Eliminar cuenta</h3>
      <p className="muted">
        Eliminar tu cuenta es <strong>irreversible</strong>.
        Se enviará un correo a tu email actual con un enlace de confirmación.
      </p>

      <form onSubmit={handleDelete} className="config-form">
        <label>
          Escribe <strong>ELIMINAR</strong> para confirmar
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="ELIMINAR"
          />
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-danger"
            disabled={confirmText !== "ELIMINAR"}
          >
            Solicitar eliminación
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
