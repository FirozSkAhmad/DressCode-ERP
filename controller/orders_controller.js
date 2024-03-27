const express = require('express')
const OrdersService = require('../services/orders_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();



const router = express.Router()

router.get('/getOrders/:executiveName', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const audience = req.aud; // Assuming the decoded token is attached to req.user
        // Split the audience to get user ID/executive ID and role type
        const [idOrExecutiveId, roleType] = audience.split(":");
        if (roleType === 'SUPER ADMIN' || roleType === 'CLIENT') {
            const executiveName = req.params.executiveName;
            const ordersServiceObj = new OrdersService()
            const data = await ordersServiceObj.getOrders(executiveName)
                .catch(err => {
                    console.log("Error occured", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            // If the role is neither super admin nor client
            res.status(403).send("Unauthorized access");
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getTotalOnlineSales', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const audience = req.aud; // Assuming the decoded token is attached to req.user
        // Split the audience to get user ID/executive ID and role type
        const [idOrExecutiveId, roleType] = audience.split(":");
        if (roleType === 'SUPER ADMIN' || roleType === 'CLIENT') {
            const executiveName = req.params.executiveName;
            const ordersServiceObj = new OrdersService()
            const data = await ordersServiceObj.getTotalOnlineSales()
                .catch(err => {
                    console.log("Error occured", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            // If the role is neither super admin nor client
            res.status(403).send("Unauthorized access");
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getTotalOfflineSales', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const audience = req.aud; // Assuming the decoded token is attached to req.user
        // Split the audience to get user ID/executive ID and role type
        const [idOrExecutiveId, roleType] = audience.split(":");
        if (roleType === 'SUPER ADMIN' || roleType === 'CLIENT') {
            const executiveName = req.params.executiveName;
            const ordersServiceObj = new OrdersService()
            const data = await ordersServiceObj.getTotalOfflineSales()
                .catch(err => {
                    console.log("Error occured", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            // If the role is neither super admin nor client
            res.status(403).send("Unauthorized access");
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getAllOfflineExecutives', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const audience = req.aud; // Assuming the decoded token is attached to req.user
        // Split the audience to get user ID/executive ID and role type
        const [idOrExecutiveId, roleType] = audience.split(":");
        if (roleType === 'SUPER ADMIN' || roleType === 'CLIENT') {
            const executiveName = req.params.executiveName;
            const ordersServiceObj = new OrdersService()
            const data = await ordersServiceObj.getAllOfflineExecutives()
                .catch(err => {
                    console.log("Error occured", err.message);
                    throw err;
                })

            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            // If the role is neither super admin nor client
            res.status(403).send("Unauthorized access");
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;