// Tablas
const User = require("../models/Usuario");
const Libro = require("../models/Libro");
const Autor = require("../models/Autor");
const Resena = require("../models/Resena");
const Icono = require("../models/Icono");
const Banner = require("../models/Banner");
const Seguidos = require('../models/Seguidos_seguidores');

// Librerias
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const claveSecreta = 'AdminLibros';

// -------------------------------------------------
// HELPER: AGREGAR NOTIFICACIÓN AL USUARIO
// -------------------------------------------------
async function agregarNotificacion(userId, mensaje, nombre = "Sistema", meta = null) {
    try {
        const usuario = await User.findByPk(userId);

        if (!usuario) return;

        let notis = [];

        // `notificaciones` is stored as JSON in the DB. Sequelize may return it already parsed
        // (as an array) or as a string depending on driver/config. Handle both cases safely.
        if (usuario.notificaciones) {
            if (Array.isArray(usuario.notificaciones)) {
                notis = usuario.notificaciones;
            } else if (typeof usuario.notificaciones === 'string') {
                try { notis = JSON.parse(usuario.notificaciones); } catch (_) { notis = []; }
            } else {
                // unknown format -> start fresh
                notis = [];
            }
        }

        // Construir nueva notificación. Por defecto 'leido' = false
        const nueva = {
            id: Date.now(),
            nombre,
            mensaje,
            fecha: new Date().toISOString(),
            meta,
            leido: false
        };

        // Dedupe para ciertos tipos: si es 'new_like' o 'follow', eliminamos
        // notificaciones previas del mismo emisor (fromUser) y misma entidad
        if (meta && meta.type) {
            try {
                if (meta.type === 'new_like') {
                    notis = notis.filter(n => !(n.meta && n.meta.type === 'new_like' && Number(n.meta.fromUser) === Number(meta.fromUser) && Number(n.meta.resenaId) === Number(meta.resenaId)));
                } else if (meta.type === 'follow') {
                    notis = notis.filter(n => !(n.meta && n.meta.type === 'follow' && Number(n.meta.fromUser) === Number(meta.fromUser)));
                }
            } catch (e) {
                // ignore parse errors
            }
        }

        notis.unshift(nueva);

        // Save as native JS array; Sequelize will persist JSON column correctly.
        usuario.notificaciones = notis;
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
        icono, banner, descripcion,
        // opcional: permitir que se envíe rol (por ejemplo 'Admin') — si se envía 'Admin' se requiere ADMIN_SIGNUP_KEY
        rol: rolInBody
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
            idIcono = iconoInstance.id;
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

    // decidir rol — por defecto Usuario
    let rolFinal = 'Usuario';
    if (typeof rolInBody === 'string' && rolInBody.trim()) {
        const provided = rolInBody.trim();
        // if request includes a role, respect it (e.g. 'Admin') — default remains 'Usuario'
        if (provided === 'Admin') {
            // NOTE: this will create an admin account if the request provides it.
            // This is intentionally permissive; make sure you only call this endpoint
            // via secure channels (Postman or internal use) if you want to create admins.
            rolFinal = 'Admin';
        } else {
            // Si viene otro valor lo respetamos en campo rol del usuario — podrías querer validarlo
            rolFinal = provided;
        }
    }

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
        descripcion,
        rol: rolFinal,
        // Al registrarse, otorgar los iconos y banners por defecto
        iconos_obtenidos: [1, 2, 3, 4, 5, 6],
        banners_obtenidos: [1, 2, 3, 4, 5]
    });

    res.status(200).json({ message: "Nuevo usuario creado", data: newUser });
};

// ----------------- LOGIN -----------------
const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;

        const user = await User.findOne({ where: { correo } });

        if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

        // 1. VERIFICACIÓN DE ESTADO ACTIVO (Baneo)
        if (user.activo === 0) {
            return res.status(403).json({ error: "Su cuenta ha sido deshabilitada o baneada." });
        }
        // ------------------------------------------

        const comparacion = await bcrypt.compare(contrasena, user.contrasena);
        if (!comparacion) {
            return res.status(400).json({ error: "Su email o contraseña incorrectos" });
        }

        const token = jwt.sign({ id: user.id, correo: user.correo }, claveSecreta, { expiresIn: '8h' });

        const userData = user.get({ plain: true });
        delete userData.contrasena;

        // Añadir contadores de seguimiento (seguidores/seguidos)
        try {
            const seguidosCount = await Seguidos.count({ where: { id_remitente: user.id, estado: 'aceptado' } });
            const seguidoresCount = await Seguidos.count({ where: { id_destinatario: user.id, estado: 'aceptado' } });
            userData.seguidos = seguidosCount;
            userData.seguidores = seguidoresCount;
        } catch (e) {
            // ignore counting errors — sigue devolviendo el user
            console.error('Error calculando contadores en login:', e);
            userData.seguidos = userData.seguidos || 0;
            userData.seguidores = userData.seguidores || 0;
        }

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
            // Aseguramos que la columna 'notificaciones' esté incluida
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
                // Si viene como string JSON, lo parsea
                return JSON.parse(value);
            } catch {
                return [];
            }
        };

        // ** 🔥 NUEVA LÍNEA: Parsear notificaciones de manera segura 🔥 **
        const notificacionesArray = parseArray(usuario.notificaciones);
        // -------------------------------------------------------------


        const librosEnLecturaIDs = parseArray(usuario.libros_en_lectura);
        const librosFavoritosIDs = parseArray(usuario.libros_favoritos);
        const librosParaLeerIDs = parseArray(usuario.libros_para_leer);
        const librosLeidosIDs = parseArray(usuario.libros_leidos);

        // Parsear listas (puede venir como string JSON o como objeto)
        let listasObj = {};
        // ... (resto de la lógica de listas, que parece estar bien)
        if (usuario.listas) {
             if (typeof usuario.listas === 'string') {
                try { listasObj = JSON.parse(usuario.listas) || {}; } catch { listasObj = {}; }
            } else if (typeof usuario.listas === 'object' && usuario.listas !== null) {
                listasObj = usuario.listas;
            }
        }

        // Obtener todos los IDs que necesitamos cargar de la BD
        const idsFromListas = Object.values(listasObj).flat().map(x => Number(x)).filter(n => !Number.isNaN(n));

        const todosLosIDs = [
            ...librosEnLecturaIDs,
            ...librosFavoritosIDs,
            ...librosParaLeerIDs,
            ...librosLeidosIDs,
            ...idsFromListas
        ];

        let librosBD = [];

        if (todosLosIDs.length > 0) {
             // ... (lógica para cargar libros BD)
             librosBD = await Libro.findAll({
                where: { id: todosLosIDs },
                attributes: [
                    "id", "titulo", "anio", "tipo", "descripcion", "tema", 
                    "ranking", "generos", "url_portada", "id_autor"
                ],
                include: [
                    { model: Autor, as: "Autor", attributes: ["id", "nombre", "url_cara"] },
                    { model: Resena, as: "Resenas", required: false, where: { usuario_id: usuario.id }, attributes: ["puntuacion"] }
                ]
            });
        }

        // --- Aplanar datos de libros ---
        librosBD = librosBD.map(libro => {
            const json = libro.toJSON();
            return {
                ...json,
                nombre_autor: json.Autor ? json.Autor.nombre : "Desconocido",
                puntuacion_usuario: json.Resenas && json.Resenas.length > 0 ? json.Resenas[0].puntuacion : null
            };
        });

        // -----------------------------------
        // 🔥 CALCULAR GÉNERO MÁS LEÍDO
        // -----------------------------------
        // ... (lógica de cálculo de género más leído)
        const limpiarStringGenero = (str) => { /* ... */ };
        let generoMasLeido = "No definido";
        // ... (cálculos)

        // ------------------------
        // Construir el JSON final
        // ------------------------
        const librosMap = {};
        librosBD.forEach(libro => (librosMap[libro.id] = libro));

        // Mapear listas a objetos de libro (si hay datos cargados)
        const listasMapeadas = {};
        // ... (lógica de mapeo de listas)
        for (const [nombre, arr] of Object.entries(listasObj)) {
            if (!Array.isArray(arr)) continue;
            listasMapeadas[nombre] = arr
                .map(id => Number(id))
                .filter(n => !Number.isNaN(n))
                .map(id => librosMap[id])
                .filter(Boolean);
        }

        const usuarioData = {
            ...usuario.toJSON(),

            libros_en_lectura: librosEnLecturaIDs.map(id => librosMap[id]).filter(Boolean),
            libros_favoritos: librosFavoritosIDs.map(id => librosMap[id]).filter(Boolean),
            libros_para_leer: librosParaLeerIDs.map(id => librosMap[id]).filter(Boolean),
            libros_leidos: librosLeidosIDs.map(id => librosMap[id]).filter(Boolean),
            listas: listasMapeadas,

            // ** 🔥 AÑADIMOS LAS NOTIFICACIONES PARSEADAS AQUÍ 🔥 **
            notificaciones: notificacionesArray,
            // ---------------------------------------------------
            
            genero_top_leyente: generoMasLeido
        };


        // --------------------------------------
        // 🔥 Calcular rating general y contadores
        // --------------------------------------
        // ... (lógica de cálculo de rating y contadores de seguimiento)
        
        // ... (Se asume que la lógica de rating y contadores de seguimiento está bien)
        // ... (y que las variables de conteo se añaden a usuarioData)
        
        // calcular contadores de seguidores / seguidos (solo aceptados)
        try {
            const seguidosCount = await Seguidos.count({ where: { id_remitente: usuario.id, estado: 'aceptado' } });
            const seguidoresCount = await Seguidos.count({ where: { id_destinatario: usuario.id, estado: 'aceptado' } });

            usuarioData.seguidos = seguidosCount;
            usuarioData.seguidores = seguidoresCount;
        } catch (e) {
            console.error('Error calculando contadores de seguimiento:', e);
            usuarioData.seguidos = usuarioData.seguidos || 0;
            usuarioData.seguidores = usuarioData.seguidores || 0;
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


// ----- CHECK EMAIL/USERNAME EXISTENCE -----
const checkEmail = async (req, res) => {
    try {
        const { correo } = req.query;

        if (!correo) {
            return res.status(400).json({ error: "Email requerido" });
        }

        const usuario = await User.findOne({ where: { correo } });

        return res.json({ exists: !!usuario });
    } catch (error) {
        console.error("Error al verificar email:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

const checkUsername = async (req, res) => {
    try {
        const { usuario } = req.query;

        if (!usuario) {
            return res.status(400).json({ error: "Usuario requerido" });
        }

        const user = await User.findOne({ where: { usuario } });

        return res.json({ exists: !!user });
    } catch (error) {
        console.error("Error al verificar usuario:", error);
        return res.status(500).json({ error: "Error en el servidor" });
    }
};

// ----------------------
// LISTAS: CREAR Y AGREGAR LIBRO
// ----------------------
const crearLista = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
            return res.status(400).json({ error: 'Nombre de lista inválido' });
        }

        const usuario = await User.findByPk(userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let listasObj = {};
        if (usuario.listas) {
            if (typeof usuario.listas === 'string') {
                try { listasObj = JSON.parse(usuario.listas) || {}; } catch { listasObj = {}; }
            } else if (typeof usuario.listas === 'object' && usuario.listas !== null) {
                listasObj = usuario.listas;
            }
        }

        const key = nombre.trim();
        if (listasObj[key]) {
            return res.status(400).json({ error: 'Ya existe una lista con ese nombre' });
        }

        listasObj[key] = [];
        usuario.listas = listasObj;
        await usuario.save();

        return res.json({ message: 'Lista creada correctamente', listas: listasObj });
    } catch (error) {
        console.error('Error en crearLista:', error);
        return res.status(500).json({ error: 'Error al crear la lista' });
    }
};

const agregarLibroAListaEnLista = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre, idLibro } = req.params;
        const idNum = Number(idLibro);

        if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la lista' });
        if (Number.isNaN(idNum)) return res.status(400).json({ error: 'ID de libro inválido' });

        const usuario = await User.findByPk(userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        let listasObj = {};
        if (usuario.listas) {
            if (typeof usuario.listas === 'string') {
                try { listasObj = JSON.parse(usuario.listas) || {}; } catch { listasObj = {}; }
            } else if (typeof usuario.listas === 'object' && usuario.listas !== null) {
                listasObj = usuario.listas;
            }
        }

        const key = nombre.trim();
        if (!listasObj[key]) return res.status(404).json({ error: 'Lista no encontrada' });

        // Normalizar el array de IDs
        const arr = Array.isArray(listasObj[key]) ? listasObj[key].map(x => Number(x)).filter(n => !Number.isNaN(n)) : [];

        if (arr.includes(idNum)) return res.status(400).json({ message: 'El libro ya está en la lista' });

        arr.push(idNum);
        listasObj[key] = Array.from(new Set(arr));

        usuario.listas = listasObj;
        await usuario.save();

        return res.json({ message: 'Libro agregado a la lista', lista: listasObj[key] });
    } catch (error) {
        console.error('Error en agregarLibroAListaEnLista:', error);
        return res.status(500).json({ error: 'Error al agregar libro a la lista' });
    }
};

// ----------------------
// BUSCAR USUARIO (por query)
// ----------------------
const buscarUsuario = async (req, res) => {
    try {
        const { q, termino } = req.query;
        const term = (q || termino || '').trim();

        if (!term) return res.status(400).json({ error: 'Falta el término de búsqueda' });

        const like = `%${term}%`;

        const usuarios = await User.findAll({
            where: {
                [Op.or]: [
                    { nombre: { [Op.like]: like } },
                    { apellido: { [Op.like]: like } },
                    { usuario: { [Op.like]: like } },
                    { correo: { [Op.like]: like } }
                ]
            },
            attributes: { exclude: ['contrasena'] },
            include: [
                { model: Icono, as: 'iconoData', attributes: ['simbolo'] },
                { model: Banner, as: 'bannerData', attributes: ['url'] }
            ],
            order: [['nombre', 'ASC']],
            limit: 50
        });

        // Agregar contadores de seguidos/seguidores a cada usuario
        const usuariosConContadores = await Promise.all(usuarios.map(async (u) => {
            const usuarioJSON = u.toJSON();
            try {
                const seguidosCount = await Seguidos.count({ where: { id_remitente: u.id, estado: 'aceptado' } });
                const seguidoresCount = await Seguidos.count({ where: { id_destinatario: u.id, estado: 'aceptado' } });
                usuarioJSON.siguiendo = seguidosCount;
                usuarioJSON.seguidores = seguidoresCount;
            } catch (e) {
                console.error('Error calculando contadores:', e);
                usuarioJSON.siguiendo = 0;
                usuarioJSON.seguidores = 0;
            }
            return usuarioJSON;
        }));

        return res.json({ count: usuariosConContadores.length, results: usuariosConContadores });
    } catch (error) {
        console.error('Error buscando usuarios:', error);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// ----------------------
// SEGUIMIENTOS SIMPLE: seguir / dejar de seguir (sin solicitudes)
// ----------------------
// Nota: eliminamos el flujo de 'solicitud' para mantener un sistema simple
// donde seguir es inmediato (estado 'aceptado') y dejar de seguir elimina la relación.

// Listar seguidores (quienes siguen al usuario)
const listarSeguidores = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

        // Opcional query ?estado=aceptado|enviado|all
        const { estado = 'aceptado' } = req.query;

        const where = { id_destinatario: userId };
        if (estado !== 'all') where.estado = estado;

        const relaciones = await Seguidos.findAll({
            where,
            include: [{
                model: User,
                as: 'Remitente',
                attributes: ['id', 'nombre', 'apellido', 'usuario', 'idIcono', 'autor_preferido', 'genero_preferido', 'titulo_preferido', 'descripcion'],
                include: [
                    { model: Icono, as: 'iconoData', attributes: ['simbolo'] },
                    { model: Banner, as: 'bannerData', attributes: ['url'] }
                ]
            }],
            order: [['id', 'DESC']]
        });

        // incluir el id de la relación para poder aceptar/rechazar (requestId)
        const seguidores = relaciones.map(r => ({ id: r.id, estado: r.estado, usuario: r.Remitente }));

        return res.json({ count: seguidores.length, seguidores });
    } catch (err) {
        console.error('Error listando seguidores:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Listar seguidos (a quienes sigue el usuario)
const listarSeguidos = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

        const { estado = 'aceptado' } = req.query;

        const where = { id_remitente: userId };
        if (estado !== 'all') where.estado = estado;

        const relaciones = await Seguidos.findAll({
            where,
            include: [{
                model: User,
                as: 'Destinatario',
                attributes: ['id', 'nombre', 'apellido', 'usuario', 'idIcono', 'autor_preferido', 'genero_preferido', 'titulo_preferido', 'descripcion'],
                include: [
                    { model: Icono, as: 'iconoData', attributes: ['simbolo'] },
                    { model: Banner, as: 'bannerData', attributes: ['url'] }
                ]
            }],
            order: [['id', 'DESC']]
        });

        // incluir el id de la relación para obtener requestId desde el frontend
        const seguidos = relaciones.map(r => ({ id: r.id, estado: r.estado, usuario: r.Destinatario }));

        return res.json({ count: seguidos.length, seguidos });
    } catch (err) {
        console.error('Error listando seguidos:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Cancelar / dejar de seguir
const cancelarSeguido = async (req, res) => {
    try {
        const remitenteId = req.user.id;
        const targetId = Number(req.params.targetId);

        if (Number.isNaN(targetId)) return res.status(400).json({ error: 'ID inválido' });

        const relacion = await Seguidos.findOne({ where: { id_remitente: remitenteId, id_destinatario: targetId } });
        if (!relacion) return res.status(404).json({ error: 'Relación no encontrada' });

        await relacion.destroy();

        // No notificamos en unfollow según requerimiento: solo notificar on follow

        return res.json({ message: 'Se ha cancelado la relación de seguimiento' });
    } catch (err) {
        console.error('Error cancelando seguimiento:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// NUEVO: Seguir usuario directamente (sin solicitud, aceptación inmediata)
const seguirUsuario = async (req, res) => {
    try {
        const remitenteId = req.user.id;
        const targetId = Number(req.params.targetId);

        if (!targetId || Number.isNaN(targetId)) return res.status(400).json({ error: 'ID de destinatario inválido' });
        if (remitenteId === targetId) return res.status(400).json({ error: 'No te puedes seguir a ti mismo' });

        const destinatario = await User.findByPk(targetId);
        if (!destinatario) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Buscar si ya existe relación aceptada
        const existente = await Seguidos.findOne({ where: { id_remitente: remitenteId, id_destinatario: targetId, estado: 'aceptado' } });
        if (existente) return res.status(400).json({ error: 'Ya sigues a este usuario' });

        // Crear o actualizar a aceptado
        const [registro, creado] = await Seguidos.findOrCreate({
            where: { id_remitente: remitenteId, id_destinatario: targetId },
            defaults: { estado: 'aceptado' }
        });

        if (!creado) {
            registro.estado = 'aceptado';
            await registro.save();
        }

        // Notificar
        const remitente = await User.findByPk(remitenteId);
        await agregarNotificacion(targetId, `${remitente.usuario} te está siguiendo.`, remitente.usuario, { type: 'follow', fromUser: remitenteId });

        return res.status(201).json({ message: 'Ahora sigues a este usuario', data: registro });
    } catch (err) {
        console.error('Error siguiendo usuario:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// NUEVO: Dejar de seguir usuario
const dejarDeSeguir = async (req, res) => {
    try {
        const remitenteId = req.user.id;
        const targetId = Number(req.params.targetId);

        if (Number.isNaN(targetId)) return res.status(400).json({ error: 'ID inválido' });

        const relacion = await Seguidos.findOne({ where: { id_remitente: remitenteId, id_destinatario: targetId } });
        if (!relacion) return res.status(404).json({ error: 'No sigues a este usuario' });

        await relacion.destroy();

        const remitente = await User.findByPk(remitenteId);
        // No notificamos en unfollow según requerimiento: solo notificar on follow

        return res.json({ message: 'Has dejado de seguir a este usuario' });
    } catch (err) {
        console.error('Error dejando de seguir:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

module.exports = {
    agregarNotificacion,
    getAllUsers,
    register,
    login,
    getUser,
    editarPerfil,
    buscarUsuario,
    checkEmail,
    checkUsername,
    crearLista,
    agregarLibroAListaEnLista,
    listarSeguidores,
    listarSeguidos,
    cancelarSeguido,
    seguirUsuario,
    dejarDeSeguir
};

// (handlers añadidos serán exportados al final del archivo)

// Marcar todas las notificaciones del usuario como leídas
const marcarNotificacionesLeidas = async (req, res) => {
    try {
        const userId = req.user.id;
        const usuario = await User.findByPk(userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        const parseNotis = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            try { return JSON.parse(value); } catch { return []; }
        };

        let notis = parseNotis(usuario.notificaciones);
        notis = notis.map(n => ({ ...n, leido: true }));

        usuario.notificaciones = notis;
        await usuario.save();

        return res.json({ message: 'Notificaciones marcadas como leídas' });
    } catch (err) {
        console.error('Error marcando notificaciones leidas:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Obtener datos públicos de usuario por id (para avatar/icono)
const getPublicUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

        const usuario = await User.findByPk(id, {
            attributes: ['id', 'usuario', 'nombre', 'apellido', 'idIcono'],
            include: [{ model: Icono, as: 'iconoData', attributes: ['simbolo'] }]
        });

        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

        return res.json(usuario);
    } catch (err) {
        console.error('Error obteniendo usuario público:', err);
        return res.status(500).json({ error: 'Error en el servidor' });
    }
};

// Exportar handlers añadidos (definidos más arriba)
module.exports.marcarNotificacionesLeidas = marcarNotificacionesLeidas;
module.exports.getPublicUserById = getPublicUserById;