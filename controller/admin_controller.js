const express = require('express');
const AdminService = require('../services/admin_service');
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const jwtHelperObj = new JwtHelper();
const router = express.Router()

router.post('/createSuperAdmin', async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        await adminServiceObj.createSuperAdmin(req.body)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
        })
    }
    catch (err) {
        next(err);
    }
})

router.post('/createStore', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const store = await adminServiceObj.createStore(req.body)
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                store
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to create stores",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.post('/deleteStore', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const result = await adminServiceObj.deleteStore(req.body)
            res.send({
                "status": 200,
                "message": result.message,
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to delete store",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get('/getProducts', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const data = await adminServiceObj.getAllProducts()
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getAllProductNames', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const data = await adminServiceObj.getAllProductNames()
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getProductSizes/:productName', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const data = await adminServiceObj.getProductSizes(req.params.productName)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getProductIdByProductNameAndSize/:productName/:size', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const productId = await adminServiceObj.getProductIdByProductNameAndSize(req.params.productName, req.params.size)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "productId": productId
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getPriceAndQuantityByProductId/:productId', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const productDetatils = await adminServiceObj.getPriceAndQuantityByProductId(req.params.productId)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "MRP": productDetatils.MRP,
            "quantity": productDetatils.quantity
        })
    }
    catch (err) {
        next(err);
    }
})
router.get('/getProductDetails/:productId', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        const adminServiceObj = new AdminService()
        const data = await adminServiceObj.getProductDetails(req.params.productId)
        res.send({
            "status": 200,
            "message": Constants.SUCCESS,
            "data": data
        })
    }
    catch (err) {
        next(err);
    }
})

router.get('/getAllStores', jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            const adminServiceObj = new AdminService()
            const data = await adminServiceObj.getAllStores()
            res.send({
                "status": 200,
                "message": Constants.SUCCESS,
                "data": data
            })
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to get all stores",
            })
        }
    }
    catch (err) {
        next(err);
    }
})

module.exports = router;