import { useState, useEffect, useRef } from "react";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SEARCH_ENDPOINT = "http://localhost:3000/nextread/buscar";

export default function SearchBar() {
    const [term, setTerm] = useState("");
       const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const timeoutRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const path = location.pathname;
    const isUserSearch =
        path.startsWith("/perfil") ||
        path.startsWith("/seguidores") ||
        path.startsWith("/seguidos");

    // -------------------------
    // BOTÓN SEGUIR
    // -------------------------
    function FollowButton({ user }) {
        const [state, setState] = useState("idle");

        const token = localStorage.getItem("token");
        const storedUser = JSON.parse(localStorage.getItem("user") || "null");
        const currentId = storedUser?.id;

        const disabledSelf = currentId && Number(currentId) === Number(user.id);

        const handleFollow = async (e) => {
            e.stopPropagation();
            if (!token) return navigate("/acceso");
            if (disabledSelf) return;

            try {
                setState("loading");

                await axios.post(
                    `http://localhost:3000/nextread/follow/request/${user.id}`,
                    {},
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setState("sent");
            } catch (err) {
                console.error("follow error", err?.response?.data || err);
                const msg = err?.response?.data?.error || "";
                if (msg.toLowerCase().includes("ya sigues")) setState("following");
                else setState("error");
            }
        };

        if (disabledSelf) return null;
        if (state === "sent") return <button className="btn-sent" disabled>Solicitud enviada</button>;
        if (state === "following") return <button className="btn-unfollow" disabled>Siguiendo</button>;
        if (state === "loading") return <button className="btn-follow" disabled>Enviando…</button>;

        return (
            <button className="btn-follow" onClick={handleFollow}>
                Seguir
            </button>
        );
    }

    // -------------------------
    // BUSCADOR
    // -------------------------
    useEffect(() => {
        if (!term.trim()) {
            setResults([]);
            setOpen(false);
            return;
        }

        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                if (isUserSearch) {
                    // BUSCAR USUARIOS
                    const { data } = await axios.get(
                        "http://localhost:3000/nextread/buscar-usuario",
                        { params: { q: term } }
                    );

                    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
                    const currentId = storedUser?.id;

                    let users = data.results || [];
                    if (currentId)
                        users = users.filter(u => Number(u.id) !== Number(currentId));

                    const normalized = users.map(u => ({
                        id: u.id,
                        nombre: u.nombre,
                        apellido: u.apellido,
                        usuario: u.usuario, // username REAL
                        icono: (u.iconoData && u.iconoData.simbolo) || null,
                        idIcono: u.idIcono ?? null
                    }));

                    setResults(normalized);
                    setOpen(true);
                } else {
                    // BUSCAR LIBROS
                    const { data } = await axios.get(SEARCH_ENDPOINT, {
                        params: { search: term }
                    });

                    setResults(data.resultados || []);
                    setOpen(true);
                }
            } catch (err) {
                console.error("Error buscando:", err);
                setResults([]);
                setOpen(false);
            }
        }, 300);

        return () => clearTimeout(timeoutRef.current);
    }, [term, path]);

    // -------------------------
    // RENDER
    // -------------------------
    return (
        <div style={{ position: "relative" }}>
            <input
                className="search-bar"
                placeholder={isUserSearch ? "Buscar usuarios..." : "Buscar libros..."}
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />

            {open && results.length > 0 && (
                <div
                    style={{
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
                    }}
                >
                    {results.map((r) => {
                        const isImage = r.icono && /\.(png|jpg|jpeg|svg)$/i.test(r.icono);
                        const imgSrc = isImage
                            ? r.icono.startsWith("http")
                                ? r.icono
                                : `/public/iconos/${r.icono.replace(/^.*[\\\/]/, "")}`
                            : null;

                        return (
                            <div
                                key={r.id}
                                style={{
                                    display: "flex",
                                    padding: 8,
                                    cursor: "pointer",
                                    alignItems: "center",
                                }}
                                onClick={() => {
                                    if (isUserSearch)
                                        navigate(`/user/${r.usuario}`);  // ← ← ← AHORA FUNCIONA PERFECTO
                                    else
                                        navigate(`/libro/${r.id}`);
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f8ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                            >
                                <div style={{ width: 40, height: 55, marginRight: 10 }}>
                                    {r.url_portada ? (
                                        <img
                                            src={r.url_portada}
                                            alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <>
                                            {imgSrc ? (
                                                <div
                                                    style={{
                                                        width: isUserSearch ? 40 : "100%",
                                                        height: isUserSearch ? 40 : "100%",
                                                        background: "#eaeaea",
                                                        borderRadius: isUserSearch ? "50%" : "8px",
                                                        overflow: "hidden",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <img
                                                        src={imgSrc}
                                                        alt="icono"
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                </div>
                                            ) : r.icono ? (
                                                <div
                                                    style={{
                                                        width: isUserSearch ? 40 : "100%",
                                                        height: isUserSearch ? 40 : "100%",
                                                        background: "#eaeaea",
                                                        borderRadius: isUserSearch ? "50%" : "8px",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        fontSize: 28,
                                                    }}
                                                >
                                                    {r.icono}
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        background: "#eaeaea",
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    📘
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={{ overflow: "hidden" }}>
                                    <div
                                        style={{
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {r.titulo ?? `${r.nombre || ""} ${r.apellido || ""}`.trim()}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#666" }}>
                                        {r.Autor?.nombre || r.usuario || ""}
                                    </div>
                                </div>

                                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
                                    {r.tipo ? (
                                        <span
                                            style={{
                                                background: "#0d6efd",
                                                color: "#fff",
                                                padding: "3px 7px",
                                                borderRadius: 10,
                                                fontWeight: 700,
                                                fontSize: 12,
                                            }}
                                        >
                                            {r.tipo}
                                        </span>
                                    ) : (
                                        <FollowButton user={r} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
