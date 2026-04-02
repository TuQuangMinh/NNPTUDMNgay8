const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "e30d15859c496f",
        pass: "be8b4985b87cb8",
    },
});
module.exports = {
    sendMail: async function (to, subject, text, html) {
        const info = await transporter.sendMail({
            from: 'admin@nnptud.com',
            to: to,
            subject: subject,
            text: text,
            html: html,
        });

        console.log("Message sent:", info.messageId);
    }
}
