    const express = require('express')
    const { getAllUsers, register, login } = require('./controller/peticionesUsuario')
    const isAuth = require('./middlewares/isAuth')
    const sequelize = require('./config/db')

    require('./models/Usuario')
    require('./models/Logro')
    require('./models/Libro')
    require('./models/Resena')
    require('./models/Usuario_Logro')
    require('./models/Amigo')
    require('./models/indexModel')

    const server = express()
    server.use(express.json())

    server.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5174')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Access-Control-Allow-Credentials', true)
        
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200)
        }

        next()
    })

    server.get('/nextread/allUsers', getAllUsers)
    server.post('/nextread/register', register)
    server.post('/nextread/login', login)

    server.listen(3000, async () => {
        try {
            await sequelize.sync({ alter: true }) // usa 'alter' si querés actualizar estructuras sin borrar datos
            console.log("Tablas sincronizadas correctamente")
            console.log("El server está corriendo en el puerto 3000")
        } catch (error) {
            console.error("Error al sincronizar las tablas:", error)
        }
    })
