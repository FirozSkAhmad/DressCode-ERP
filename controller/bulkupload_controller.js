const express = require('express')
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const BulkUploadService = require('../services/bulkupload_service')
const jwtHelperObj = new JwtHelper();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to verify if the uploaded file is a CSV
function isCsvFile(file) {
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    const mimeType = file.mimetype;
    return fileExtension === 'csv' && mimeType === 'text/csv';
}

router.post("/bulkUploadOnlineSales", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }
                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processOnlineSalesCsvFile(req.file.buffer);
                res.send(result)
            }
            catch (error) {
                // Send the error message in the response
                res.status(500).send({
                    "status": 500,
                    error: error
                });
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to upload the online sales data",
            })
        }

    }
    catch (err) {
        console.log("error while uploading the products", err);
        next(err);
    }
})

router.post("/bulkUploadOfflineSales", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        if (req.aud.split(":")[3] === "EXECUTIVE") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }
                const executiveName = req.aud.split(":")[1]

                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processOfflineSalesCsvFile(req.file.buffer, executiveName);
                res.send(result)
            } catch (error) {
                // Send the error message in the response
                res.status(500).send({
                    "status": 500,
                    error: error
                });
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Client has access to upload the offline sales data",
            })
        }
    }
    catch (err) {
        console.log("error while uploading the products", err);
        next(err);
    }
})

router.post("/bulkUploadProducts", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }
                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processProductsCsvFile(req.file.buffer);
                res.send(result)
            }
            catch (error) {
                // Send the error message in the response
                res.status(500).send({
                    "status": 500,
                    error: error
                });
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to upload the products",
            })
        }
    }
    catch (err) {
        console.log("error while uploading the products", err);
        next(err);
    }
})

router.patch("/bulkUpdateProducts", jwtHelperObj.verifyAccessToken, upload.single('file'), async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            try {
                if (!req.file || !isCsvFile(req.file)) {
                    return res.status(400).send({ "status": 400, "message": "Invalid file format. Please upload a CSV file." });
                }
                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processProductsToUpdateCsvFile(req.file.buffer);
                res.send(result)
            }
            catch (error) {
                // Send the error message in the response
                res.status(500).send({
                    "status": 500,
                    error: error
                });
            }
        }
        else {
            res.send({
                "status": 401,
                "message": "only Super Admin has access to upload the products",
            })
        }
    }
    catch (err) {
        console.log("error while uploading the products", err);
        next(err);
    }
})

module.exports = router;