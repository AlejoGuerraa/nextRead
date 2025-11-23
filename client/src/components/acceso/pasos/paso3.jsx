// Step3.jsx
export const Step3 = ({ form, errors, onChange, avatarOptions, toggleAvatar, next, back, showPicker }) => (
    <div className="step">

        {/* ---------- CSS INCRUSTADO ---------- */}
        <style>{`
            .perfil-icono {
                display: flex;
                justify-content: center;
                margin-bottom: 16px;
                cursor: pointer;
            }

            .perfil-img {
                width: 90px;
                height: 90px;
                border-radius: 50%;
                object-fit: cover;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                transition: transform 0.25s ease;
            }

            .perfil-img:hover {
                transform: scale(1.08);
            }

            .avatar-picker {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 14px;
                margin: 10px 0 20px 0;
            }

            .avatar {
                width: 55px;
                height: 55px;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.20s ease, box-shadow 0.20s ease;
                object-fit: cover;
            }

            .avatar:hover {
                transform: scale(1.12);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .avatar.selected {
                outline: 3px solid #6c47ff;
                outline-offset: 3px;
                border-radius: 50%;
            }

            textarea {
                width: 100%;
                height: 100px;
                padding: 12px;
                border-radius: 10px;
                border: 1px solid #bbb;
                resize: none;
                margin-top: 10px;
                font-family: inherit;
            }

            .input-error {
                border: 2px solid #ff4b4b !important;
            }

            .error-message {
                color: #ff4b4b;
                font-size: 14px;
                margin-top: 4px;
            }

            .buttons {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }

            .btn-modal {
                background: #5a4fff;
                color: white;
                padding: 10px 20px;
                border-radius: 10px;
                border: none;
                cursor: pointer;
                transition: background 0.25s ease, transform 0.25s ease;
                font-size: 15px;
            }

            .btn-modal:hover {
                background: #493dff;
                transform: translateY(-3px);
            }
        `}</style>
        {/* ---------- FIN CSS ---------- */}

        <h2>Personaliza tu perfil</h2>

        <div className="perfil-icono" onClick={() => toggleAvatar()}>
            <img
                src={form.avatar}
                alt="Avatar seleccionado"
                className="perfil-img"
            />
        </div>

        {showPicker && (
            <div className="avatar-picker">
                {avatarOptions.map((a, i) => (
                    <img
                        key={i}
                        src={a}
                        className={`avatar ${form.avatar === a ? "selected" : ""}`}
                        onClick={() => toggleAvatar(a)}
                    />
                ))}
            </div>
        )}


        <textarea
            name="descripcion"
            placeholder="Contanos sobre vos..."
            value={form.descripcion}
            onChange={onChange}
            className={errors.descripcion ? 'input-error' : ''}
        />

        {errors.descripcion && <p className="error-message">{errors.descripcion}</p>}

        <div className="buttons">
            <button className="btn-modal" onClick={back}>← Atrás</button>
            <button className="btn-modal" onClick={next}>Siguiente ➜</button>
        </div>
    </div>
);
