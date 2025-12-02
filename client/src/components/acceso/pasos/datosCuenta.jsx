import { useState } from "react";

import axios from "axios";

import { Eye, EyeOff } from "lucide-react";


export const Step1 = ({ form, errors, onChange, next, openLogin }) => {

  const [showPass, setShowPass] = useState(false);

  const [showRepeatPass, setShowRepeatPass] = useState(false);


  const handleEmailChange = async (e) => {

    const newEmail = e.target.value;

    onChange(e);


    if (newEmail && newEmail.includes("@")) {

      try {

        const response = await axios.get(

          `http://localhost:3000/nextread/check-email?correo=${encodeURIComponent(newEmail)}`

        );

        if (response.data.exists) {

          errors.correo = "Este email ya está registrado";

        } else {

          if (errors.correo === "Este email ya está registrado") {

            delete errors.correo;

          }

        }

      } catch (error) {

        console.error("Error al verificar email:", error);

      }

    }

  };


  const canProceed = () => {

    return (

      form.correo &&

      form.contrasena &&

      form.repeatPassword &&

      !errors.correo &&

      !errors.contrasena &&

      !errors.repeatPassword &&

      form.correo.includes("@") &&

      form.contrasena.length >= 8 &&

      form.contrasena === form.repeatPassword

    );

  };


  return (

    <div className="step">

      <style>{`

        .step input {

          width: 100%;

          padding: 10px 12px;

          font-size: 16px;

          border: 1px solid #ccc;

          border-radius: 8px;

          box-sizing: border-box;

          margin-bottom: 10px;

        }


        .step input::placeholder {

          font-size: 16px;

          color: #999;

          opacity: 1;

        }


        .password-field {

          position: relative;

          width: 100%;

        }


        .password-field input {

          width: 100%;

          padding-right: 40px;

        }


        .toggle-pass {

          position: absolute;

          right: 12px;

          top: 50%;

          transform: translateY(-50%);

          cursor: pointer;

          color: #666;

          display: flex;

          align-items: center;

          transition: color 0.2s;

        }


        .toggle-pass:hover {

          color: #000;

        }


        .input-error {

          border-color: #f44336;

        }


        .error-message {

          color: #f44336;

          font-size: 14px;

          margin: 0 0 8px 0;

          text-align: left;

        }


        .btn-modal.next-btn {

          width: 100%;

          padding: 10px 0;

          border: none;

          border-radius: 8px;

          background-color: #1A374D;

          color: white;

          font-size: 16px;

          cursor: pointer;

          margin-top: 10px;

        }


        .redirect-link {

          display: block;

          margin-top: 12px;

          color: #406882;

          cursor: pointer;

          font-size: 14px;

        }

      `}</style>


      <h2>Forma parte de NextRead</h2>


      <input

        type="email"

        name="correo"

        placeholder="Email"

        value={form.correo}

        onChange={handleEmailChange}

        className={errors.correo ? "input-error" : ""}

      />

      {errors.correo && <p className="error-message">{errors.correo}</p>}


      {/* CONTRASEÑA */}

      <div className="password-field">

        <input

          type={!showPass ? "password" : "text"}

          name="contrasena"

          placeholder="Contraseña"

          value={form.contrasena}

          onChange={onChange}

          className={errors.contrasena ? "input-error" : ""}

        />

        <span className="toggle-pass" onClick={() => setShowPass(!showPass)}>

          {!showPass ? <Eye size={20} /> : <EyeOff size={20} />}

        </span>

      </div>

      {errors.contrasena && <p className="error-message">{errors.contrasena}</p>}


      {/* REPEAT PASS */}

      <div className="password-field">

        <input

          type={!showRepeatPass ? "password" : "text"}

          name="repeatPassword"

          placeholder="Repetir contraseña"

          value={form.repeatPassword}

          onChange={onChange}

          className={errors.repeatPassword ? "input-error" : ""}

        />

        <span className="toggle-pass" onClick={() => setShowRepeatPass(!showRepeatPass)}>

          {!showRepeatPass ? <Eye size={20} /> : <EyeOff size={20} />}

        </span>

      </div>

      {errors.repeatPassword && <p className="error-message">{errors.repeatPassword}</p>}


      <button 

        className="btn-modal next-btn"

        onClick={next}

        disabled={!canProceed()}

        style={{ opacity: canProceed() ? 1 : 0.5, cursor: canProceed() ? "pointer" : "not-allowed" }}

      >

        Terminado ➜

      </button>


      <span className="redirect-link" onClick={openLogin}>

        ¿Ya tenés cuenta? Inicia sesión

      </span>

    </div>

  );

};
