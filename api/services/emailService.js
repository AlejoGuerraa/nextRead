const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "NextReadOficial@gmail.com",
        pass: "qaud qnnn xupf ewmg"  // ⚠️ Reemplazar si falla: regenerar en Google Account
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Log transporter status on load (non-blocking)
transporter.verify().then(() => {
    console.log('Email transporter is ready');
}).catch((err) => {
    console.warn('Email transporter verification failed:', err && err.message ? err.message : err);
});

module.exports = async function sendEmail({ to, subject, html }) {
    if (!to) throw new Error('No recipient `to` provided to emailService');
    const mail = {
        from: '"NextRead" <NextReadOficial@gmail.com>',
        to,
        subject,
        html
    };

    try {
        const info = await transporter.sendMail(mail);
        console.log('Email sent:', info && info.messageId ? info.messageId : info);
        return info;
    } catch (err) {
        console.error('Error sending email:', err && err.message ? err.message : err);
        throw err;
    }
};
