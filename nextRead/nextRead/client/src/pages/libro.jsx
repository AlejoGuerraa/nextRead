import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InfoLibro from "../components/infoLibro";
import Resenas from "../components/reseñas";
import Header from "../components/Header"; // Tu componente de header
import Footer from "../components/Footer"; // Tu componente de footer
import "../pagescss/libro.css";

const API_BASE = "http://localhost:3000/nextread";

const safeParseGeneros = (generosData) => {
  if (Array.isArray(generosData)) return generosData;
  if (typeof generosData === "string") {
    try {
      const parsed = JSON.parse(generosData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function Libro() {
  const { id } = useParams();
  const [libro, setLibro] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/libro/${id}`)
      .then((res) => {
        const data = { ...res.data, generos: safeParseGeneros(res.data.generos) };
        setLibro(data);
        setError(null);
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo cargar la información del libro.");
        setLibro(null);
      });
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!libro) return <p className="cargando">Cargando información del libro...</p>;

  return (
    <div className="pagina-libro">
      <Header /> {/* Usamos tu componente de Header */}

      <div className="libro-detalle-container">
        <InfoLibro libro={libro} />
        <Resenas />
      </div>

      <Footer /> {/* Usamos tu componente de Footer */}
    </div>
  );
}
