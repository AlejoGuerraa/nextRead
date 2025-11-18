// src/components/UserCard.jsx
import React from "react";
import "./usercard.css";

export default function UserCard({ data, tipo }) {
  return (
    <div className="user-card">
      <div className="avatar">
        {data.nombre.charAt(0).toUpperCase()}
      </div>

      <div className="info">
        <h3>{data.nombre}</h3>
        <p>@{data.username}</p>
      </div>

      {tipo === "seguidores" ? (
        <button className="btn-follow">Seguir de vuelta</button>
      ) : (
        <button className="btn-unfollow">Dejar de seguir</button>
      )}
    </div>
  );
}
