// HeaderAcceso.jsx
import { useNavigate } from "react-router-dom";
import "../../pagescss/headerAcceso.css";

export default function HeaderAcceso() {
  const navigate = useNavigate();

  return (
    <>
      <header className="header-acceso">
        <div className="acceso-left">
          <div className="logo-circle-acceso">
            <img
              src="/icono.png"
              alt="NextRead"
              className="home-img-acceso"
            />
          </div>

          <span className="app-title-acceso">NextRead</span>
        </div>
      </header>
    </>
  );
}
