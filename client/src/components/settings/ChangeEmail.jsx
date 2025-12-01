import React, { useState } from 'react';
import axios from "axios";

export default function ChangeEmail() {
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email !== confirm) {
      setMessage({ type: 'error', text: 'Los correos no coinciden.' });
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/nextread/user/change-email-request",
        { newEmail: email },
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );

      setMessage({ type: "info", text: res.data.msg });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Error al solicitar el cambio.",
      });
    }
  };

  return (
    <section className="config-section">
      <h3>Cambiar correo electrónico</h3>

      <form onSubmit={handleSubmit} className="config-form">
        <label>
          Nuevo correo
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label>
          Confirmar correo
          <input
            type="email"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary">Solicitar cambio</button>
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
