// Tablas
const User = require("../models/Usuario");
const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const Resena = require("../models/Resena");
const Icono = require("../models/Icono");
const Banner = require("../models/Banner");

// Librerias
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const claveSecreta = 'AdminLibros';

// -------------------------------------------------
// HELPER: AGREGAR NOTIFICACIÓN AL USUARIO
// -------------------------------------------------
async function agregarNotificacion(userId, mensaje, nombre = "Sistema") {
    try {
        const usuario = await User.findByPk(userId);

        if (!usuario) return;

        let notis = [];

        if (usuario.notificaciones) {
            try {
                notis = JSON.parse(usuario.notificaciones);
            } catch (_) { notis = []; }
        }

        const nueva = {
            id: Date.now(),
            nombre,
            mensaje,
            fecha: new Date().toISOString()
        };

        notis.unshift(nueva);

        usuario.notificaciones = JSON.stringify(notis);
        await usuario.save();
    } catch (err) {
        console.log("Error guardando notificación:", err);
    }
}

// ----------------- GET USERS -----------------
const getAllUsers = async (_req, res) => {
    try {
        const usuarios = await User.findAll({ attributes: { exclude: ['contrasena'] } });
        res.json(usuarios);
    } catch (error) {
        return res.status(404).json({ error: "No se encontró ningún usuario registrado" });
    }
};

// ----------------- REGISTER -----------------
const register = async (req, res) => {
    console.log(req.body);

    const {
        nombre, apellido, correo, usuario, contrasena, fecha_nacimiento,
        // Recibimos el símbolo del icono y la URL del banner
        icono, banner, descripcion
    } = req.body;

    // 1. VALIDACIONES BÁSICAS
    if (!nombre || !apellido || !correo || !contrasena || !fecha_nacimiento) {
        return res.status(401).json({ error: "Ingrese toda la información necesaria para continuar" });
    }

    // 2. VALIDACIÓN DE CONTRASEÑA
    const tieneMayuscula = [...contrasena].some(letra => letra >= 'A' && letra <= 'Z');
    const tieneLongitud = contrasena.length >= 8;

    if (!tieneMayuscula || !tieneLongitud) {
        return res.status(400).json({
            error: "La contraseña debe tener al menos 8 caracteres y contener al menos una letra mayúscula"
        });
    }

    // 3. COMPROBACIÓN DE EXISTENCIA
    const usuarioasd = await User.findOne({ where: { usuario } });
    if (usuarioasd) return res.status(400).json({ error: "El nombre de usuario ya está registrado" });

    const correoadsd = await User.findOne({ where: { correo } });
    if (correoadsd) return res.status(400).json({ error: "El correo ya está registrado" });

    // --- LÓGICA CLAVE: BUSCAR O CREAR ÍCONO Y BANNER ---

    let idIcono = null;
    let idBanner = null;

    try {
        // Manejar Icono: Buscar por símbolo. Si no existe, lo crea.
        if (icono !== undefined) {
            const [iconoInstance] = await Icono.findOrCreate({
                where: { simbolo: icono },   // simbolo = "/iconos/LogoDefault1.jpg"
                defaults: { simbolo: icono }
            });
            usuario.idIcono = iconoInstance.id;
        }


        // Manejar Banner: Buscar por URL. Si no existe, lo crea.
        if (banner) {
            const [bannerInstance, created] = await Banner.findOrCreate({
                where: { url: banner },
                defaults: { url: banner } // Datos para crear si no existe
            });
            idBanner = bannerInstance.id;

            if (created) {
                console.log(`Nuevo banner creado dinámicamente: ${banner}`);
            }
        }

    } catch (error) {
        // En caso de un error de base de datos durante la búsqueda/creación
        console.error("Error buscando o creando Icono/Banner:", error);
        return res.status(500).json({ error: "Error interno al procesar Icono/Banner." });
    }

    // 4. CREACIÓN DEL USUARIO
    const hashedPassw = await bcrypt.hash(contrasena, 10);

    const newUser = await User.create({
        nombre,
        apellido,
        correo,
        usuario,
        contrasena: hashedPassw,
        fecha_nacimiento,
        // Usamos los IDs obtenidos/creados
        idIcono: idIcono,
        idBanner: idBanner,
        descripcion
    });

    res.status(200).json({ message: "Nuevo usuario creado", data: newUser });
};

// ----------------- LOGIN -----------------
const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const user = await User.findOne({ where: { correo } });

        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        const comparacion = await bcrypt.compare(contrasena, user.contrasena);
        if (!comparacion) {
            return res.status(400).json({ error: "Su email o contraseña incorrectos" });
        }

        const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' });

        const userData = user.get({ plain: true });
        delete userData.contrasena;

        return res.status(200).json({ token, ...userData });
    } catch (err) {
        console.error("Error en login:", err);
        return res.status(500).json({ error: "Error en el servidor al intentar loguear" });
    }
};


const getUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const usuario = await User.findOne({
            where: { id: userId },
            include: [
                { model: Icono, as: "iconoData", attributes: ["simbolo"] },
                { model: Banner, as: "bannerData", attributes: ["url"] }
            ],
            attributes: { exclude: ['contrasena'] }
        });

        if (!usuario) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // --- Parseo seguro de arrays JSON ---
        const parseArray = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            try {
                return JSON.parse(value);
            } catch {
                return [];
            }
        };

        const librosEnLecturaIDs = parseArray(usuario.libros_en_lectura);
        const librosFavoritosIDs = parseArray(usuario.libros_favoritos);
        const librosLeidosIDs = parseArray(usuario.libros_leidos);

        const todosLosIDs = [
            ...librosEnLecturaIDs,
            ...librosFavoritosIDs,
            ...librosLeidosIDs
        ];

        let librosBD = [];

        if (todosLosIDs.length > 0) {
            librosBD = await Libro.findAll({
                where: { id: todosLosIDs },
                attributes: [
                    "id",
                    "titulo",
                    "anio",
                    "tipo",
                    "descripcion",
                    "tema",
                    "ranking",
                    "generos",
                    "url_portada",
                    "id_autor"
                ],
                include: [
                    {
                        model: Autor,
                        as: "Autor",
                        attributes: ["id", "nombre", "url_cara"]
                    },
                    {
                        model: Resena,
                        as: "Resenas",
                        required: false,
                        where: { usuario_id: usuario.id },
                        attributes: ["puntuacion"]
                    }
                ]
            });
        }

        // --- Aplanar datos de libros ---
        librosBD = librosBD.map(libro => {
            const json = libro.toJSON();

            return {
                ...json,
                nombre_autor: json.Autor ? json.Autor.nombre : "Desconocido",
                puntuacion_usuario:
                    json.Resenas && json.Resenas.length > 0
                        ? json.Resenas[0].puntuacion
                        : null
            };
        });

        // -----------------------------------
        // 🔥 CALCULAR GÉNERO MÁS LEÍDO (STRING)
        // -----------------------------------
        let generoMasLeido = "No definido";

        try {
            const generosContador = {};

            const librosLeidos = librosBD.filter(lib => librosLeidosIDs.includes(lib.id));

            for (const libro of librosLeidos) {
                if (!libro.generos) continue;

                let generosArray;

                // Si viene como "Fantasía, Acción"
                if (typeof libro.generos === "string") {
                    generosArray = libro.generos.split(",").map(g => g.trim());
                }
                // Si viene como JSON ["Fantasía", "Acción"]
                else if (Array.isArray(libro.generos)) {
                    generosArray = libro.generos;
                }

                if (generosArray) {
                    for (const genero of generosArray) {
                        generosContador[genero] = (generosContador[genero] || 0) + 1;
                    }
                }
            }

            // Obtener género más usado
            const entries = Object.entries(generosContador);

            if (entries.length > 0) {
                const genero = entries.sort((a, b) => b[1] - a[1])[0][0];
                generoMasLeido = String(genero); // ← SIEMPRE STRING
            }

        } catch (err) {
            console.error("Error calculando género más leído:", err);
        }

        // ❗ Ya NO ponemos genero_preferido acá
        // usuario.dataValues.genero_preferido = generoMasLeido;


        // ------------------------
        // Construir el JSON final
        // ------------------------
        const librosMap = {};
        librosBD.forEach(libro => (librosMap[libro.id] = libro));

        const limpiarStringGenero = (str) => {
            if (!str) return "";
            return String(str)
                .replace(/[\[\]"]+/g, "")  // saca corchetes y comillas
                .replace(/\\+/g, "")       // saca escapes
                .trim();                   // limpia espacios
        };

        generoMasLeido = limpiarStringGenero(generoMasLeido);

        const usuarioData = {
            ...usuario.toJSON(),

            libros_en_lectura: librosEnLecturaIDs.map(id => librosMap[id]).filter(Boolean),
            libros_favoritos: librosFavoritosIDs.map(id => librosMap[id]).filter(Boolean),
            libros_leidos: librosLeidosIDs.map(id => librosMap[id]).filter(Boolean),

            // 🔥 NUEVO ATRIBUTO SIEMPRE STRING
            genero_top_leyente: generoMasLeido
        };



        // --------------------------------------
        // 🔥 Calcular rating general
        // --------------------------------------

        let ratingGeneral = null;

        const resenasUsuario = await Resena.findAll({
            where: { usuario_id: usuario.id },
            attributes: ["puntuacion"]
        });

        if (resenasUsuario.length > 0) {
            const ratings = resenasUsuario
                .map(r => r.puntuacion)
                .filter(n => typeof n === "number");

            if (ratings.length > 0) {
                ratingGeneral = Math.round(
                    (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
                ) / 10;
            }
        }

        return res.json(usuarioData);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};


const editarPerfil = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            nombre,
            apellido,
            descripcion,
            banner,   // URL nueva
            icono,    // emoji nuevo
            genero_preferido,
            autor_preferido,
            titulo_preferido
        } = req.body;

        const usuario = await User.findByPk(userId);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

        // 🔹 1. Actualiza texto normal
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (descripcion !== undefined) usuario.descripcion = descripcion;
        if (genero_preferido !== undefined) usuario.genero_preferido = genero_preferido;
        if (autor_preferido !== undefined) usuario.autor_preferido = autor_preferido;
        if (titulo_preferido !== undefined) usuario.titulo_preferido = titulo_preferido;

        // 🔹 2. Manejar ICONO
        if (icono !== undefined) {
            const [iconoInstance] = await Icono.findOrCreate({
                where: { simbolo: icono },   // simbolo = "/iconos/LogoDefault1.jpg"
                defaults: { simbolo: icono }
            });
            usuario.idIcono = iconoInstance.id;
        }


        // 🔹 3. Manejar BANNER (URL)
        if (banner !== undefined) {
            const [bannerInstance] = await Banner.findOrCreate({
                where: { url: banner },
                defaults: { url: banner }
            });
            usuario.idBanner = bannerInstance.id;
        }

        await usuario.save();

        return res.json({
            msg: "Perfil actualizado correctamente",
            usuario
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar perfil" });
    }
};


module.exports = {
    agregarNotificacion,
    getAllUsers,
    register,
    login,
    getUser,
    editarPerfil
};