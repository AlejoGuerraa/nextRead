const nodemailer = require("nodemailer");

const emailService = process.env.EMAIL_SERVICE || "gmail";
const emailUser = process.env.EMAIL_USER || "NextReadOficial@gmail.com";
const emailFrom = process.env.EMAIL_FROM || "NextRead <NextReadOficial@gmail.com>";

const transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
        user: emailUser,
        pass: process.env.EMAIL_PASS
    },ectUnauthorized: false
    
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
        from: emailFrom,
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
