const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Make sure to have these variables set in your environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

router.post('/sendPDF', async (req, res) => {
  // Validate input
  if (!req.body.phn_no || !req.body.s3Url) {
    return res.status(400).json({ error: 'Missing phone number or media URL' });
  }

  const phoneNumber = `whatsapp:+91${req.body.phn_no}`;

  const mediaUrl = req.body.s3Url; // Your publicly accessible media URL

  try {
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: phoneNumber,
      body:`Your invoice is ready! Please click the link to download the invoice:-${mediaUrl}`
    });

    console.log("Message sent with ID:", message.sid);
    res.status(200).json({ message: 'PDF sent successfully', messageId: message.sid });
  } catch (error) {
    console.error("Error sending WhatsApp message", error);
    res.status(500).json({ error: 'Failed to send PDF via WhatsApp' });
  }
});


module.exports = router;
