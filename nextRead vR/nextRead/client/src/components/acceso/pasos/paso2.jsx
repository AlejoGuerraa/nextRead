// src/components/RegisterSteps/Step2.jsx
export const Step2 = ({ form, errors, onChange, next, back }) => (
    <div className="step">
        <h2>Crea tu usuario</h2>

        <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange}
            className={errors.nombre ? 'input-error' : ''} />
        {errors.nombre && <p className="error-message">{errors.nombre}</p>}

        <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={onChange}
            className={errors.apellido ? 'input-error' : ''} />
        {errors.apellido && <p className="error-message">{errors.apellido}</p>}

        <input name="usuario" placeholder="UserName" value={form.usuario} onChange={onChange}
            className={errors.usuario ? 'input-error' : ''} />
        {errors.usuario && <p className="error-message">{errors.usuario}</p>}

        <input type="date" name="nacimiento" value={form.nacimiento} onChange={onChange}
            className={errors.nacimiento ? 'input-error' : ''} />
        {errors.nacimiento && <p className="error-message">{errors.nacimiento}</p>}

        <div className="buttons">
            <button className="btn-modal" onClick={back}>← Atrás</button>
            <button className="btn-modal" onClick={next}>Siguiente ➜</button>
        </div>
    </div>
);
