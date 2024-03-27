const express = require('express')
const billingService = require('../services//billing_service');
const Constants = require('../utils/Constants/response_messages')
const multer = require('multer');
const upload = multer();
const nodemailer = require('nodemailer');
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();

const router = express.Router()

router.post('/createNewBill', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const executiveId = req.aud.split(":")[0]
        const billingServiceObj = new billingService();
        const result = await billingServiceObj.createNewBill(req.body, executiveId)
            .catch(err => {
                console.log("error", err.message);
                throw err;
            })

        res.send({
            "status": 201,
            "orderId": result.orderId,
            "message": result.message,
        })
    }
    catch (err) {
        next(err);
    }
})

router.post('/sendEmail', upload.single('pdf'), async (req, res) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SENDER_EMAIL_ID,
            pass: process.env.SENDER_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.SENDER_EMAIL_ID,
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.text,
        attachments: [
            {
                filename: req.file.originalname,
                content: req.file.buffer,
            },
        ],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        res.json({ message: `Email sent: ${info.response}` });
    } catch (err) {
        console.error('Error sending email', err);
        res.status(500).json({ error: 'Error sending email' });
    }
})

module.exports = router;