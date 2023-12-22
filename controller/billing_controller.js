const express = require('express')
const billingService = require('../services//billing_service');
const Constants = require('../utils/Constants/response_messages')

const router = express.Router()

router.post('/createNewBill', async (req, res, next) => {
    try {
        const billingServiceObj = new billingService();
        const result = await billingServiceObj.createNewBill(req.body)
            .catch(err => {
                console.log("error", err.message);
                throw err;
            })

        res.send({
            "status": 201,
            "message": result.message,
        })
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;