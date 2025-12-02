import { useEffect, useState } from 'react';

import axios from 'axios';


export const Step3 = ({ form, errors, onChange, avatarOptions, toggleAvatar, next, back, showPicker }) => {

    const [iconos, setIconos] = useState([]);

    const [loadingIconos, setLoadingIconos] = useState(true);

    const [firstIconUrl, setFirstIconUrl] = useState(null);


    useEffect(() => {

        axios

            .get('http://localhost:3000/nextread/iconos')

            .then((res) => {

                setIconos(res.data);

                setLoadingIconos(false);

                if (res.data.length > 0) {

                    const firstIcon = res.data[0].simbolo;

                    setFirstIconUrl(firstIcon);

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


    const defaultAvatars = [

        '/iconos/LogoDefault1.jpg',

        '/iconos/LogoDefault2.png',

        '/iconos/LogoDefault3.jpg',

        '/iconos/LogoDefault4.png'

    ];


    let icons = [];

    if (iconos.length > 0) {

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

                    transition: transform 0.20s ease, box-shadow 0.20s ease, border 0.2s;

                    object-fit: cover;

                    border: 2px solid transparent;

                }


                .avatar:hover {

                    transform: scale(1.12);

                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);

                }


                .avatar.selected {

                    border-color: #1A374D;

                    box-shadow: 0 0 10px rgba(26,55,77,0.4);

                }


                textarea {

                    width: 100%;

                    height: 100px;

                    padding: 12px;

                    border-radius: 8px;

                    border: 1px solid #ccc;

                    resize: none;

                    margin-top: 10px;

                    font-family: inherit;

                    font-size: 16px;

                    transition: box-shadow 0.2s, border-color 0.2s;

                }


                textarea:focus {

                    border-color: #1A374D;

                    box-shadow: 0 2px 8px rgba(26,55,77,0.2);

                    outline: none;

                }


                .input-error {

                    border: 2px solid #f44336 !important;

                }


                .error-message {

                    color: #f44336;

                    font-size: 14px;

                    margin-top: 4px;

                }


                .buttons {

                    display: flex;

                    justify-content: space-between;

                    margin-top: 20px;

                }


                .btn-modal {

                    background: #1A374D;

                    color: white;

                    padding: 10px 20px;

                    border-radius: 8px;

                    border: none;

                    cursor: pointer;

                    transition: background 0.25s ease, transform 0.25s ease;

                    font-size: 16px;

                }


                .btn-modal:hover:not(:disabled) {

                    background: #406882;

                    transform: translateY(-2px);

                }


                .btn-modal:disabled {

                    opacity: 0.5;

                    cursor: not-allowed;

                }

            `}</style>


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

                    Finalizado ➜

                </button>

            </div>

        </div>

    );

}

