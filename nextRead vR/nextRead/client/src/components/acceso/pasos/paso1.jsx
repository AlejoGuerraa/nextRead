// src/components/RegisterSteps/Step1.jsx
export const Step1 = ({ form, errors, onChange, next, openLogin }) => (
    <div className="step">
        <h2>Forma parte de NextRead</h2>

        <input type="email" name="correo" placeholder="Email"
            value={form.correo} onChange={onChange} className={errors.correo ? 'input-error' : ''} />
        {errors.correo && <p className="error-message">{errors.correo}</p>}

        <input type="password" name="contrasena" placeholder="Contraseña"
            value={form.contrasena} onChange={onChange} className={errors.contrasena ? 'input-error' : ''} />
        {errors.contrasena && <p className="error-message">{errors.contrasena}</p>}

        <input type="password" name="repeatPassword" placeholder="Repetir contraseña"
            value={form.repeatPassword} onChange={onChange} className={errors.repeatPassword ? 'input-error' : ''} />
        {errors.repeatPassword && <p className="error-message">{errors.repeatPassword}</p>}

        <button className="btn-modal next-btn" onClick={next}>Siguiente ➜</button>

        <span className="redirect-link" onClick={openLogin}>
            ¿Ya tenés cuenta? Inicia sesión
        </span>
    </div>
);
