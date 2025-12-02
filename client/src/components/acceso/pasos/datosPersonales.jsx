import { useState } from "react";

import axios from "axios";


export const Step2 = ({ form, errors, onChange, next, back }) => {

  const handleUsernameChange = async (e) => {

    const newUsername = e.target.value;

    onChange(e);


    if (newUsername && newUsername.length >= 3) {

      try {

        const response = await axios.get(

          `http://localhost:3000/nextread/check-username?usuario=${encodeURIComponent(newUsername)}`

        );

        if (response.data.exists) {

          errors.usuario = "Este nombre de usuario ya está en uso";

        } else {

          if (errors.usuario === "Este nombre de usuario ya está en uso") {

            delete errors.usuario;

          }

        }

      } catch (error) {

        console.error("Error al verificar usuario:", error);

      }

    }

  };


  const handleBirthDateChange = (e) => {

    const selectedDate = new Date(e.target.value);

    const today = new Date();

    today.setHours(0, 0, 0, 0);


    if (selectedDate > today) {

      errors.nacimiento = "La fecha de nacimiento no puede ser posterior a hoy";

    } else {

      if (errors.nacimiento === "La fecha de nacimiento no puede ser posterior a hoy") {

        delete errors.nacimiento;

      }

    }

    onChange(e);

  };


  const canProceed = () => {

    return (

      form.nombre &&

      form.apellido &&

      form.usuario &&

      form.nacimiento &&

      !errors.nombre &&

      !errors.apellido &&

      !errors.usuario &&

      !errors.nacimiento &&

      form.usuario.length >= 3

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

          transition: box-shadow 0.2s, border-color 0.2s;

        }


        .step input::placeholder {

          font-size: 16px;

          color: #999;

          opacity: 1;

        }


        .step input:focus {

          border-color: #1A374D;

          box-shadow: 0 2px 8px rgba(26, 55, 77, 0.2);

          outline: none;

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


        .buttons {

          display: flex;

          justify-content: space-between;

          margin-top: 12px;

        }


        .btn-modal {

          padding: 10px 20px;

          border: none;

          border-radius: 8px;

          background-color: #1A374D;

          color: white;

          font-size: 16px;

          cursor: pointer;

          transition: background-color 0.2s, box-shadow 0.2s;

        }


        .btn-modal:hover:not(:disabled) {

          background-color: #406882;

          box-shadow: 0 2px 8px rgba(26, 55, 77, 0.2);

        }


        .btn-modal:disabled {

          opacity: 0.5;

          cursor: not-allowed;

        }

      `}</style>


      <h2>Crea tu usuario</h2>


      <input

        name="nombre"

        placeholder="Nombre"

        value={form.nombre}

        onChange={onChange}

        className={errors.nombre ? "input-error" : ""}

      />

      {errors.nombre && <p className="error-message">{errors.nombre}</p>}


      <input

        name="apellido"

        placeholder="Apellido"

        value={form.apellido}

        onChange={onChange}

        className={errors.apellido ? "input-error" : ""}

      />

      {errors.apellido && <p className="error-message">{errors.apellido}</p>}


      <input

        name="usuario"

        placeholder="UserName"

        value={form.usuario}

        onChange={handleUsernameChange}

        className={errors.usuario ? "input-error" : ""}

      />

      {errors.usuario && <p className="error-message">{errors.usuario}</p>}


      <input

        type="date"

        name="nacimiento"

        value={form.nacimiento}

        onChange={handleBirthDateChange}

        className={errors.nacimiento ? "input-error" : ""}

      />

      {errors.nacimiento && <p className="error-message">{errors.nacimiento}</p>}


      <div className="buttons">

        <button className="btn-modal" onClick={back}>

          ← Atrás

        </button>

        <button 

          className="btn-modal" 

          onClick={next}

          disabled={!canProceed()}

        >

          Terminado ➜

        </button>

      </div>

    </div>

  );

};
