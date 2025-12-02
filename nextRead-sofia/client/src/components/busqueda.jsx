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

    // Sub-component used for user results: handles sending a follow request
    function FollowButton({ user }) {
        const [state, setState] = useState('idle'); // idle | loading | sent | following | error

        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const token = storedUser?.token;
        const currentId = storedUser?.id;

        const disabledSelf = currentId && Number(currentId) === Number(user.id);

        const handleFollow = async (e) => {
            e.stopPropagation();
            if (!token) return navigate('/acceso');
            if (disabledSelf) return;

            try {
                setState('loading');
                await axios.post(`http://localhost:3000/nextread/follow/request/${user.id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
                setState('sent');
            } catch (err) {
                console.error('follow error', err?.response?.data || err);
                // if server says already following, set following
                const msg = err?.response?.data?.error || '';
                if (msg.toLowerCase().includes('ya sigues')) setState('following');
                else setState('error');
            }
        };

        if (disabledSelf) return null;

        if (state === 'sent') return <button className="btn-sent" onClick={(e) => e.stopPropagation()} disabled>Solicitud enviada</button>;
        if (state === 'following') return <button className="btn-unfollow" onClick={(e) => e.stopPropagation()} disabled>Siguiendo</button>;
        if (state === 'loading') return <button className="btn-follow" disabled>Enviando…</button>;

        return (
            <button
                className="btn-follow"
                onClick={handleFollow}
            >
                Seguir
            </button>
        );
    }

    useEffect(() => {
        if (!term || term.trim() === "") {
            setResults([]);
            setOpen(false);
            return;
        }
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(async () => {
            try {
                // If we're on profile page show users (buscar-usuario), otherwise use book search
                const isProfile = location.pathname && location.pathname.includes('/perfil');

                if (isProfile) {
                    // user search endpoint
                    const { data } = await axios.get('http://localhost:3000/nextread/buscar-usuario', { params: { q: term } });

                    // when logged in hide current user from results
                    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
                    const currentId = storedUser?.id;

                    let users = data.results || [];
                    if (currentId) users = users.filter(u => Number(u.id) !== Number(currentId));

                    // normalize user fields
                    const normalizedUsers = users.map(u => ({
                        id: u.id,
                        nombre: u.nombre,
                        apellido: u.apellido,
                        usuario: u.usuario,
                        icono: (u.iconoData && u.iconoData.simbolo) || null,
                        idIcono: u.idIcono ?? null
                    }));

                    setResults(normalizedUsers);
                    setOpen(true);
                } else {
                    const { data } = await axios.get(SEARCH_ENDPOINT, { params: { search: term } });
                    setResults(data.resultados || []);
                    setOpen(true);
                }

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
                placeholder={location.pathname && location.pathname.includes('/perfil') ? 'Buscar usuarios...' : 'Buscar libros...'}
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
                            onClick={() => {
                                // if we're on profile page, results are users -> navigate to their profile
                                const isProfile = location.pathname && location.pathname.includes('/perfil');
                                if (isProfile) {
                                    navigate(`/perfil/${r.id}`);
                                } else {
                                    navigate(`/libro/${r.id}`);
                                }
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f8ff")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                        >
                            <div style={{ width: 40, height: 55, marginRight: 10 }}>
                                {/* If this result has a cover (book) show it, otherwise show user icon or placeholder. On profile page, user icon is circular. */}
                                {r.url_portada ? (
                                    <img src={r.url_portada} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    (() => {
                                        const isProfile = location.pathname && location.pathname.includes('/perfil');
                                        // Check if icono is a path to image
                                        const isImage = r.icono && (typeof r.icono === 'string') && (/\.(png|jpg|jpeg|svg)$/i.test(r.icono));
                                        if (isImage) {
                                            // Build correct path for public folder
                                            let imgSrc = r.icono;
                                            if (!/^https?:\/\//.test(imgSrc)) {
                                                imgSrc = `/public/iconos/${imgSrc.replace(/^.*[\\\/]/, '')}`;
                                            }
                                            return (
                                                <div style={{
                                                    width: isProfile ? 40 : '100%',
                                                    height: isProfile ? 40 : '100%',
                                                    background: "#eaeaea",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    borderRadius: isProfile ? "50%" : "8px",
                                                    overflow: "hidden",
                                                    margin: isProfile ? "auto" : undefined
                                                }}>
                                                    <img src={imgSrc} alt="icono" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                </div>
                                            );
                                        } else if (r.icono) {
                                            return (
                                                <div style={{
                                                    width: isProfile ? 40 : '100%',
                                                    height: isProfile ? 40 : '100%',
                                                    background: "#eaeaea",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    borderRadius: isProfile ? "50%" : "8px",
                                                    fontSize: 28,
                                                    margin: isProfile ? "auto" : undefined
                                                }}>
                                                    {r.icono}
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div style={{ width: "100%", height: "100%", background: "#eaeaea", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                    {'📘'}
                                                </div>
                                            );
                                        }
                                    })()
                                )}
                            </div>

                            <div style={{ overflow: "hidden" }}>
                                {/* if it's a book obj it'll have titulo; if user obj uses nombre */}
                                <div style={{ fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                                    {r.titulo || `${r.nombre || ''} ${r.apellido || ''}`.trim()}
                                </div>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                    {r.Autor?.nombre || r.usuario || ''}
                                </div>
                            </div>

                            <div style={{ marginLeft: "auto", paddingLeft: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                                {/* If book => show tipo badge; if user => show follow button */}
                                {r.tipo ? (
                                    <span style={{ background: "#0d6efd", color: "#fff", padding: "3px 7px", borderRadius: 10, fontWeight: 700, fontSize: 12 }}>
                                        {r.tipo || "Libro"}
                                    </span>
                                ) : (
                                    <FollowButton user={r} />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}