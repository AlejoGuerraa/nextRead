// SearchBar.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SEARCH_ENDPOINT = "http://localhost:3000/nextread/buscar";

export default function SearchBar() {
    const [term, setTerm] = useState("");
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!term || term.trim() === "") {
            setResults([]);
            setOpen(false);
            return;
        }
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                const { data } = await axios.get(SEARCH_ENDPOINT, { params: { search: term } });
                setResults(data.resultados || []);
                setOpen(true);
            } catch (e) {
                console.error("Error fetching search results:", e);
                setResults([]);
                setOpen(false);
            }
        }, 300);

        return () => clearTimeout(timeoutRef.current);
    }, [term]);

    return (
        <div style={{ position: "relative" }}>
            <input
                className="search-bar"
                placeholder="Buscar libros..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
            {open && results.length > 0 && (
                <div style={{
                    position: "absolute",
                    top: "45px",
                    left: 0,
                    width: 300,
                    maxHeight: 350,
                    overflowY: "auto",
                    background: "#fff",
                    borderRadius: 8,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    zIndex: 1000,
                }}>
                    {results.map((r) => (
                        <div
                            key={r.id}
                            style={{ display: "flex", padding: 8, cursor: "pointer", alignItems: "center" }}
                            onClick={() => navigate(`/libro/${r.id}`)}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f8ff")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                        >
                            <div style={{ width: 40, height: 55, marginRight: 10 }}>
                                {r.url_portada ? (
                                    <img src={r.url_portada} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (<div style={{ width: "100%", height: "100%", background: "#eaeaea", display: "flex", justifyContent: "center", alignItems: "center" }}>📘</div>)}
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <div style={{ fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{r.titulo}</div>
                                <div style={{ fontSize: 12, color: "#666" }}>{r.Autor?.nombre || "Autor desconocido"}</div>
                            </div>
                            <div style={{ marginLeft: "auto", paddingLeft: 8 }}>
                                <span style={{ background: "#0d6efd", color: "#fff", padding: "3px 7px", borderRadius: 10, fontWeight: 700, fontSize: 12 }}>
                                    {r.tipo || "Libro"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
