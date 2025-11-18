// HeaderAcceso.jsx
import { useNavigate } from "react-router-dom";
import libroIcono from "../../assets/libroIcono.png";

export default function HeaderAcceso() {
  const navigate = useNavigate();

  return (
    <>
      <header className="header-acceso">
        <div className="acceso-left" onClick={() => navigate("/")}>
          <div className="logo-circle-acceso">
            <img src={libroIcono} alt="NextRead" className="home-img-acceso" />
          </div>

          <span className="app-title-acceso">NextRead</span>
        </div>
      </header>

      <style>{`
        .header-acceso {
          display: flex;
          align-items: center;
          padding: 16px 36px;
          background: linear-gradient(90deg, #1A374D, #406882);
          border-bottom: 3px solid #6998AB;
          box-shadow: 0 6px 25px rgba(0,0,0,0.25);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .acceso-left {
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
        }

        .logo-circle-acceso {
          width: 52px;
          height: 52px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          box-shadow: 0 3px 8px rgba(0,0,0,0.25);
        }

        .home-img-acceso {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .app-title-acceso {
          font-family: "Montserrat Alternates", sans-serif;
          font-weight: 600;
          font-size: 32px;
          color: #dde6ecff;
          text-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        @media (max-width: 600px) {
          .header-acceso {
            padding: 12px 18px;
          }

          .app-title-acceso {
            font-size: 26px;
          }

          .logo-circle-acceso {
            width: 44px;
            height: 44px;
            padding: 5px;
          }

          .home-img-acceso {
            width: 30px;
            height: 30px;
          }
        }
      `}</style>
    </>
  );
}