import React, { useEffect } from "react";
import { motion } from "framer-motion";
import "../pagescss/footer/sobreNosotros.css";
import { Link, useLocation } from "react-router-dom";

import Header from "../components/header";
import Footer from "../components/footer";

import ilustracionFilosofia from "../assets/ImagenSobreNosotros.png";

const SobreNosotros = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <>
      <Header
        onRestrictedAction={() => alert("¡Inicia sesión para acceder!")}
      />

      <div className="about-container section-1">

        <motion.div
          className="about-image-wrapper"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >

          <div className="decor-circle"></div>
          <img

            src="/icono.png"
            alt="Logo de NextRead, un universo literario"
            className="about-image"
          />
        </motion.div>


        <div className="about-text text-extended">
          <h4 className="about-tag">SOBRE NOSOTROS</h4>

          <h1 className="about-title extended-title">
            NEXTREAD: TU UNIVERSO LITERARIO <br />EN UN SOLO LUGAR.
          </h1>


          <p className="about-desc">
            NextRead es la aplicación web que combina tu biblioteca personal con la dinámica social. Diseñada para los fanáticos de la lectura, simplifica la organización de libros y el registro de actividades, resolviendo la dificultad de gestionar tu universo literario.
          </p>

          <p className="about-desc">
            Nuestra plataforma permite a cada usuario construir su propio espacio mediante listas personalizadas, reseñas y valoraciones. Su propósito es facilitar el acceso a contenido relevante y ayudar a los lectores a encontrar nuevos libros según sus intereses y entorno.
          </p>

          <p className="about-desc">
            Con un enfoque en la simplicidad, NextRead integra la organización personal, la comunidad lectora activa y las herramientas de descubrimiento. Es ideal para usuarios casuales, frecuentes y avanzados que buscan una experiencia fluida y completa.
          </p>

          <Link to="/acceso" className="about-btn">
            Empieza a Organizar tus Lecturas
          </Link>
        </div>
      </div>


      <div className="about-philosophy-section">
        <div className="about-container philosophy-inner">


          <div className="philosophy-text">
            <h2 className="philosophy-title">LA FILOSOFÍA NEXTREAD</h2>
            <p className="philosophy-intro">
              En NextRead, creemos firmemente que la lectura debe ser una experiencia enriquecedora y sin fricciones. Nuestra plataforma se rige por principios clave que guían cada desarrollo:
            </p>
            <ul className="philosophy-list">
              <li><strong>Simplicidad Intuitiva:</strong> Interfaz clara y limpia. Queremos que te concentres en tus libros, no en cómo usar la aplicación.</li>
              <li><strong>Personalización a tu Medida:</strong> Te permite personalizar tu perfil, crear listas temáticas ilimitadas y adaptar la experiencia a tus hábitos y gustos.</li>
              <li><strong>Comunidad Vibrante:</strong> Conecta con amigos, descubre qué están leyendo otros, explora tendencias y comparte tus opiniones en un espacio dedicado.</li>
              <li><strong>Seguridad y Privacidad:</strong> Tú decides la privacidad de tu perfil y el contenido que compartes, asegurando un entorno de confianza.</li>
            </ul>
          </div>


          <div className="philosophy-image-wrapper">
            <img src={ilustracionFilosofia} alt="Ilustración de principios de NextRead" className="philosophy-logo" />
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default SobreNosotros;