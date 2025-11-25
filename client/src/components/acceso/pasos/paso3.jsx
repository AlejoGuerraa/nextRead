// Step3.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export const Step3 = ({ form, errors, onChange, avatarOptions, toggleAvatar, next, back, showPicker }) => {
    const [iconos, setIconos] = useState([]);
    const [loadingIconos, setLoadingIconos] = useState(true);
    const [firstIconUrl, setFirstIconUrl] = useState(null);

    useEffect(() => {
        // Fetch iconos from backend
        axios
            .get('http://localhost:3000/nextread/iconos')
            .then((res) => {
                setIconos(res.data);
                setLoadingIconos(false);
                // Set default avatar to first icon
                if (res.data.length > 0) {
                    const firstIcon = res.data[0].simbolo;
                    setFirstIconUrl(firstIcon);
                    // Only set if form.avatar is empty
                    if (!form.avatar || form.avatar === '') {
                        toggleAvatar(firstIcon);
                    }
                }
            })
            .catch((err) => {
                console.error('Error al obtener iconos:', err);
                setLoadingIconos(false);
            });
    }, []);

    // Si no hay iconos de BD, usamos avatarOptions o defaults
    const defaultAvatars = [
        '/iconos/LogoDefault1.jpg',
        '/iconos/LogoDefault2.png',
        '/iconos/LogoDefault3.jpg',
        '/iconos/LogoDefault4.png'
    ];

    // Determine which icons to display - limit to first 4
    let icons = [];
    if (iconos.length > 0) {
        // Si tenemos iconos de BD, usamos sus símbolos (solo los primeros 4)
        icons = iconos.slice(0, 4).map(i => i.simbolo);
    } else if (Array.isArray(avatarOptions) && avatarOptions.length > 0) {
        icons = avatarOptions.slice(0, 4);
    } else {
        icons = defaultAvatars;
    }

    const canProceed = () => {
        return form.avatar && form.descripcion && !errors.descripcion;
    };

    return (
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
                width: 60px;
                height: 60px;
                border-radius: 50%;
                cursor: pointer;
                transition: transform 0.20s ease, box-shadow 0.20s ease;
                object-fit: cover;
                border: 2px solid transparent;
            }

            .avatar:hover {
                transform: scale(1.12);
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            }

            .avatar.selected {
                border-color: #ffffff;
                box-shadow: 0 0 10px rgba(255,255,255,0.6);
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

            .btn-modal:hover:not(:disabled) {
                background: #493dff;
                transform: translateY(-3px);
            }

            .btn-modal:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `}</style>
        {/* ---------- FIN CSS ---------- */}

        <h2>Personaliza tu perfil</h2>

        <div className="perfil-icono" onClick={() => toggleAvatar()}>
            <img
                src={form.avatar || firstIconUrl || '/iconos/LogoDefault1.jpg'}
                alt="Avatar seleccionado"
                className="perfil-img"
            />
        </div>

        {showPicker && (
            <div className="avatar-picker">
                {icons.map((a, i) => (
                    <img
                        key={i}
                        src={a}
                        className={`avatar ${form.avatar === a ? "selected" : ""}`}
                        onClick={() => toggleAvatar(a)}
                        alt={`avatar-${i}`}
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
            <button 
                className="btn-modal" 
                onClick={next}
                disabled={!canProceed()}
            >
                Siguiente ➜
            </button>
        </div>
    </div>
);
}
