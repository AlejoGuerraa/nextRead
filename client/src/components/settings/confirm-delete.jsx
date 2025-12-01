// File: src/pages/ConfirmDelete.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ConfirmDelete() {
  const [msg, setMsg] = useState("Validando...");
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    if (!token) {
      setMsg("Token inválido.");
      return;
    }

    axios.post("http://localhost:3000/nextread/user/delete-account-confirm", { token })
      .then(() => {
        setMsg("Tu cuenta fue eliminada correctamente.");
        localStorage.clear();
      })
      .catch(() => setMsg("El enlace expiró o es inválido."));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>{msg}</h2>
    </div>
  );
}
