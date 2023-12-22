const express = require('express')
const router = express.Router()
const Constants = require('../utils/Constants/response_messages')
const JwtHelper = require('../utils/Helpers/jwt_helper')
const BulkUploadService = require('../services/bulkupload_service')
const jwtHelperObj = new JwtHelper();
const multer = require('multer');
const path = require('path');
let g = ""

router.post("/bulkUploadOnlineSales", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            try {
                let storage = multer.diskStorage({
                    destination: function (req, file, callback) {
                        callback(null, process.env.FILE_UPLOAD_PATH)
                    },
                    filename: function (req, file, callback) {
                        callback(null, file.originalname)
                        g = file.originalname;
                    }
                })

                const uploadAsync = () => {
                    return new Promise((resolve, reject) => {
                        let upload = multer({
                            storage: storage,
                            fileFilter: function (req, file, callback) {
                                let ext = path.extname(file.originalname);
                                if (ext !== '.csv' && ext !== '.xlsx') {
                                    return callback(res.end('Only Excel files or Csv are allowed'), null);
                                }
                                callback(null, true);
                            },
                        }).single('file');
                        upload(req, res, function (err) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                };

                await uploadAsync();
                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processOnlineSalesCsvFile(process.env.FILE_UPLOAD_PATH.concat(g));
                res.send({
                    result,
                })
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

router.post("/bulkUploadOfflineSales", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[3] === "CLIENT") {
            try {
                const storeName = req.aud.split(":")[1]
                const clientName = req.aud.split(":")[2]

                let storage = multer.diskStorage({
                    destination: function (req, file, callback) {
                        callback(null, process.env.FILE_UPLOAD_PATH)
                    },
                    filename: function (req, file, callback) {
                        callback(null, file.originalname)
                        g = file.originalname;
                    }
                })

                const uploadAsync = () => {
                    return new Promise((resolve, reject) => {
                        let upload = multer({
                            storage: storage,
                            fileFilter: function (req, file, callback) {
                                let ext = path.extname(file.originalname);
                                if (ext !== '.csv' && ext !== '.xlsx') {
                                    return callback(res.end('Only Excel files or Csv are allowed'), null);
                                }
                                callback(null, true);
                            },
                        }).single('file');
                        upload(req, res, function (err) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                resolve();
                            }
                        });
                    });
                };

                await uploadAsync();
                const bulkUploadServiceObj = new BulkUploadService();
                const result = await bulkUploadServiceObj.processOfflineSalesCsvFile(process.env.FILE_UPLOAD_PATH.concat(g), storeName, clientName);
                res.send({
                    result
                })
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

router.post("/bulkUploadProducts", jwtHelperObj.verifyAccessToken, async (req, res, next) => {
    try {
        if (req.aud.split(":")[1] === "SUPER ADMIN") {
            let storage = multer.diskStorage({
                destination: function (req, file, callback) {
                    callback(null, process.env.FILE_UPLOAD_PATH)
                },
                filename: function (req, file, callback) {
                    callback(null, file.originalname)
                    g = file.originalname;
                }
            })

            const uploadAsync = () => {
                return new Promise((resolve, reject) => {
                    let upload = multer({
                        storage: storage,
                        fileFilter: function (req, file, callback) {
                            let ext = path.extname(file.originalname);
                            if (ext !== '.csv' && ext !== '.xlsx') {
                                return callback(res.end('Only Excel files or Csv are allowed'), null);
                            }
                            callback(null, true);
                        },
                    }).single('file');
                    upload(req, res, function (err) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            };

            await uploadAsync();
            const bulkUploadServiceObj = new BulkUploadService();
            const result = await bulkUploadServiceObj.processProductsCsvFile(process.env.FILE_UPLOAD_PATH.concat(g));
            res.send({
                "status": 200,
                "message": result,
            })
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