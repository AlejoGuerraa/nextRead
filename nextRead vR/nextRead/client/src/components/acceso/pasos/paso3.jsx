
// src/components/RegisterSteps/Step3.jsx
export const Step3 = ({ form, errors, onChange, avatarOptions, toggleAvatar, next, back, showPicker }) => (
    <div className="step">
        <h2>Personaliza tu perfil</h2>

        <div className="perfil-icono" onClick={() => toggleAvatar()}>{form.avatar}</div>
        <p>Click en el avatar para cambiarlo</p>

        {showPicker && (
            <div className="avatar-picker">
                {avatarOptions.map((a, i) => (
                    <span key={i} className={`avatar ${form.avatar === a ? 'selected' : ''}`}
                        onClick={() => toggleAvatar(a)}>
                        {a}
                    </span>
                ))}
            </div>
        )}

        <textarea name="descripcion" placeholder="Contanos sobre vos..."
            value={form.descripcion} onChange={onChange}
            className={errors.descripcion ? 'input-error' : ''} />
        {errors.descripcion && <p className="error-message">{errors.descripcion}</p>}

        <div className="buttons">
            <button className="btn-modal" onClick={back}>← Atrás</button>
            <button className="btn-modal" onClick={next}>Siguiente ➜</button>
        </div>
    </div>
);
