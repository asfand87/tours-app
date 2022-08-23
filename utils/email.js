const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');



module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = `Asfand Yar <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // sendinBlue

            return nodemailer.createTransport({
                host: "smtp-relay.sendinblue.com",
                port: 587,
                auth: {
                    user: process.env.SENDING_BLUE_USERNAME,
                    pass: process.env.SENDIN_BLUE_API_KEY,


                }
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Send the actual email
    async send(template, subject) {
        // console.log("this is url now ", this.url);
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.convert(html)
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to Tours');
    }
    async sendPasswordReset() {
        await this.send("passwordReset", "Your Password Reset Token (Valid for only 10 minutes)");
    }
};