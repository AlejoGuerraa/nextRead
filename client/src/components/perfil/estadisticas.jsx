export default function Estadisticas({ user, ratingGeneral, onCreateList }) {

    const librosLeidosCount = (() => {
        if (!user.libros_leidos) return 0;

        // Caso array real
        if (Array.isArray(user.libros_leidos)) {
            return user.libros_leidos.length;
        }

        // Caso JSON string
        try {
            const arr = JSON.parse(user.libros_leidos);
            return Array.isArray(arr) ? arr.length : 0;
        } catch {
            return 0;
        }
    })();

    const stats = {
        libros_leidos: librosLeidosCount ?? 0,
        autor_preferido: user.autor_preferido || "No definido",
        genero_mas_leido: (() => {
            if (!user.genero_top_leyente) return "No definido";
            if (Array.isArray(user.genero_top_leyente)) return user.genero_top_leyente[0] || "No definido";
            return String(user.genero_top_leyente);
        })(),
        titulo_preferido: user.titulo_preferido || "No definido",
        seguidos: user.seguidos ?? 0,
        seguidores: user.seguidores ?? 0,
    };


    return (
        <aside className="profile-right card-glass">
            <h4>Actividad último mes</h4>
            <ul className="activity-list">
                <li>Has leído <strong>{stats.libros_leidos}</strong> libros</li>
                <li>Género más leído: <strong>{stats.genero_mas_leido === "No definido" ? "—" : stats.genero_mas_leido}</strong></li>
                <li>Rating general: <strong>{ratingGeneral ? `${ratingGeneral} / 5` : "—"}</strong></li>
            </ul>
            <div className="cta-row">
                <button className="btn-outline" onClick={onCreateList}>Crear lista</button>
            </div>
        </aside>
    );
}