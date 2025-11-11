import { useState, useEffect, useRef } from "react";
import React from "react";

function Footer() {
    return (
        <footer
            style={{
                backgroundColor: "#3b3939ff",
                color: "#d4d1d1ff",
                textAlign: "center",
                padding: "15px 0",
                borderTop: "1px solid #ddd",
                marginTop: "40px",
            }}
        >
            <p style={{ margin: 0 }}>
                © {new Date().getFullYear()} <strong>NextRead</strong>. Todos los derechos reservados.
            </p>
        </footer>
    );
}

export default Footer;
