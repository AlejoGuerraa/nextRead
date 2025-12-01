import React from 'react';
import '../pagescss/footer.css'; 
import { Link } from "react-router-dom";

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
                
                <div className="footer-section contact"> 
                    <h4>Contacto</h4>
                    <p>Email: <a href="mailto:nextreadoficial@gmail.com">nextreadoficial@gmail.com</a></p>
                    <p>Teléfono: +54 911 3421 1426</p>
                </div>

                <div className="footer-section links">
                    <h4>Enlaces</h4>
                    <ul>
                        <li><Link to="/">Inicio</Link></li>
                        <li><Link to="/nosotros">Sobre Nosotros</Link></li>
                        <li><Link to="/cookies">Cookies</Link></li>

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