const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "NextReadOficial@gmail.com",
        pass: "glmz onkq jjlv jzmn"
    }
});

module.exports = async function sendEmail({ to, subject, html }) {
    return transporter.sendMail({
        from: "NextRead 📚",
        to,
        subject,
        html
    });
};
