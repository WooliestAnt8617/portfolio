// routes/contactRoutes.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use other services or SMTP
    auth: {
        user: process.env.CONTACT_EMAIL_USER, // Your email address
        pass: process.env.CONTACT_EMAIL_PASS  // Your email password or app-specific password
    }
});

// Contact Form Endpoint
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    try {
        const mailOptions = {
            from: process.env.CONTACT_EMAIL_USER, // Sender address
            to: process.env.CONTACT_RECIPIENT_EMAIL, // Recipient address (your admin email)
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error('Nodemailer response error:', error.response);
        } else if (error.code === 'EENVELOPE' || error.code === 'EAUTH') {
            console.error('Nodemailer authentication or envelope error. Check CONTACT_EMAIL_USER and CONTACT_EMAIL_PASS in your .env file.');
        } else {
            console.error('Other Nodemailer error details:', error);
        }
        res.status(500).json({ message: 'Failed to send message. Please try again later.', error: error.message });
    }
});

module.exports = router;
