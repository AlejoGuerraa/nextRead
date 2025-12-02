import React from 'react';
import '../pagescss/footer.css'; 

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFacebookF, 
    faTwitter, 
    faInstagram 
} from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
    return (
        <footer className="main-footer"> 
            <div className="footer-content-wrapper">
                
                {/* 1. SECCIÓN CONTACTO (IZQUIERDA) */}
                <div className="footer-section contact"> 
                    <h4>Contacto</h4>
                    <p>Email: <a href="mailto:nextreadoficial@gmail.com">nextreadoficial@gmail.com</a></p>
                    <p>Teléfono: +54 911 3421 1426</p>
                </div>

                {/* 2. SECCIÓN ENLACES (CENTRO) */}
                <div className="footer-section links">
                    <h4>Enlaces</h4>
                    <ul>
                        <li><a href="/">Inicio</a></li>
                        <li><a href="/nosotros">Sobre Nosotros</a></li>
                        <li><a href="/cookies">Cookies</a></li>

                        {/* enlace a PDF en public */}
                        <li>
                            <a 
                                href="/Manual de Usuario - NextRead.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Ayuda
                            </a>
                        </li>
                    </ul>
                </div>
                
                {/* 3. SECCIÓN SÍGUENOS (DERECHA) */}
                <div className="footer-section social">
                    <h4>Seguinos</h4>
                    <div className="social-icons">
                        <a href="TU_LINK_FACEBOOK" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faFacebookF} />
                        </a>
                        <a href="TU_LINK_TWITTER" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faTwitter} />
                        </a>
                        <a href="TU_LINK_INSTAGRAM" target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon icon={faInstagram} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;