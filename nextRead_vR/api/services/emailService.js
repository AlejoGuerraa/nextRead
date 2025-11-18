const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'marcos.costa@bue.edu.ar',
        pass: '',
    },
});


transporter.sendMail({
    from: `Equipo de NextRead`,
    to: "power.sofiaet36@gmail.com",
    subject: 'Autenticación de Correo',
    html: "<h1>Bienvenido a nuestra pagina</h1><p>Necesitamos que realice la autenticación de correo electronico</p> "
}).then(info => {
    console.log(info);
    console.log('EMAIL ENVIADO CORRECTAMENTE');
}).catch(err => {
    console.log('ERROR AL ENVIAR EMAIL', err);
});