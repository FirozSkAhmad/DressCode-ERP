const fs = require('fs');
const csv = require('csv-parser');
const { Store, Order, Oproduct, Product } = require('../utils/Models/Models');

class BulkUpload {
    constructor() {

    }
    async processOnlineSalesCsvFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            const nonShopifyRows = [];

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        // Check each row and record non-Shopify rows
                        results.forEach((item, index) => {
                            if (item['Store Name'] !== 'Shopify') {
                                nonShopifyRows.push({ row: index + 1, "Store Name": item['Store Name'] });
                            }
                        });

                        if (nonShopifyRows.length > 0) {
                            const errorMessage = nonShopifyRows.map(row => `Row ${row.row}: ${row['Store Name']}`).join(', ');
                            // Create a custom error object with a status code
                            const error = new Error(`Rows with non-Shopify store names:- ${errorMessage}`);
                            error.statusCode = 400; // Set the status code
                            reject(error);
                            return;
                        }


                        const message = await this.uploadBulkOnlineSalesData(results);
                        resolve(message);
                    } catch (error) {
                        console.error('Error in uploadBulkSalesData:', error);
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.error('Error reading the file:', error);
                    reject(error);
                });
        });
    }

    async uploadBulkOnlineSalesData(data) {
        const errorMessages = [];
        let successfulAdditions = 0;

        try {
            // Collect all orderIds from the data
            const orderIds = data.map(item => item['Order ID']);

            // Find any existing orders with these orderIds
            const existingOrders = await Order.findAll({
                where: { orderId: orderIds }
            });

            // Prepare a map of existing orderIds for quick lookup
            const existingOrderIds = existingOrders.map(order => (order.orderId));

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];

                    // Check for duplicates
                    if (existingOrderIds.includes(parseInt(item['Order ID']))) {
                        errorMessages.push(`Row ${i + 1}: Order with ID '${item['Order ID']}' already exists.`);
                        continue; // Skip this iteration
                    }

                    // Find store
                    const store = await Store.findOne({
                        where: { storeName: item['Store Name'] },
                        transaction: t
                    });

                    if (!store) {
                        errorMessages.push(`Row ${i + 1}: Store named '${item['Store Name']}' not found.`);
                        continue; // Skip this iteration
                    }

                    // Create order
                    const order = await Order.create({
                        storeId: store.storeId,
                        clientName: item['Client Name'],
                        orderId: item['Order ID'],
                        orderedDate: item['Billing Date'],
                        totalPrice: item['Total Price']
                    }, { transaction: t });

                    successfulAdditions++;
                    const productsCount = ((Object.keys(item).length - 6) / 4)
                    // Process each product
                    for (let i = 1; i <= productsCount; i++) {
                        if (item[`Product ${i} ID`]) {
                            await Oproduct.create({
                                orderId: order.orderId,
                                productId: item[`Product ${i} ID`],
                                productName: item[`Product ${i}`],
                                quantity: item[`Product ${i} Quantity`],
                                price: item[`Product ${i} Price`],
                                subEntity: item[`Sub-Entity`],
                            }, { transaction: t });
                        }
                    }
                }
            });

            let finalMessage = successfulAdditions > 0 ? `${successfulAdditions} orders added successfully.` : "";
            if (errorMessages.length > 0) {
                finalMessage = errorMessages.join('. ') + (finalMessage ? ' ' + finalMessage : '');
                return {
                    status: 400,
                    message: finalMessage
                };
            } else {
                return {
                    status: 200,
                    message: finalMessage
                };
            }

        } catch (error) {
            console.error('Error processing CSV file:', error);
            throw error;
        }
    }


    async processOfflineSalesCsvFile(filePath, storeName, clientName) {
        return new Promise((resolve, reject) => {
            const results = [];
            const nonMatchingRows = [];

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        // Check each row and record rows with non-matching store or client names
                        results.forEach((item, index) => {
                            let mismatchDetails = [];
                            if (item['Store Name'] !== storeName) {
                                mismatchDetails.push(`Store - ${item['Store Name']} (expected: ${storeName})`);
                            }
                            if (item['Client Name'] !== clientName) {
                                mismatchDetails.push(`Client - ${item['Client Name']} (expected: ${clientName})`);
                            }
                            if (mismatchDetails.length > 0) {
                                nonMatchingRows.push({ row: index + 1, details: mismatchDetails.join(', ') });
                            }
                        });

                        if (nonMatchingRows.length > 0) {
                            const errorMessage = nonMatchingRows.map(row => `Row ${row.row}: ${row.details}`).join('; ');
                            const error = new Error(`Rows with non-matching data: ${errorMessage}`);
                            error.statusCode = 400;
                            reject(error);
                            return;
                        }

                        const message = await this.uploadBulkOfflineSalesData(results);
                        resolve(message);
                    } catch (error) {
                        console.error('Error in uploadBulkSalesData:', error);
                        reject(error);
                    }
                })
                .on('error', (error) => {
                    console.error('Error reading the file:', error);
                    reject(error);
                });
        });
    }

    async uploadBulkOfflineSalesData(data) {
        const errorMessages = [];
        let successfulAdditions = 0;

        try {
            // Collect all orderIds from the data
            const orderIds = data.map(item => item['Order ID']);

            // Find any existing orders with these orderIds
            const existingOrders = await Order.findAll({
                where: { orderId: orderIds }
            });

            // Prepare a map of existing orderIds for quick lookup
            const existingOrderIds = existingOrders.map(order => (order.orderId));

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {
                for (let i = 0; i < data.length; i++) {
                    const item = data[i];

                    // Check for duplicates
                    if (existingOrderIds.includes(parseInt(item['Order ID']))) {
                        errorMessages.push(`Row ${i + 1}: Order with ID '${item['Order ID']}' already exists.`);
                        continue; // Skip this iteration
                    }

                    // Find store
                    const store = await Store.findOne({
                        where: { storeName: item['Store Name'] },
                        transaction: t
                    });

                    if (!store) {
                        errorMessages.push(`Row ${i + 1}: Store named '${item['Store Name']}' not found.`);
                        continue; // Skip this iteration
                    }

                    // Create order
                    const order = await Order.create({
                        storeId: store.storeId,
                        clientName: item['Client Name'],
                        orderId: item['Order ID'],
                        orderedDate: item['Billing Date'],
                        totalPrice: item['Total Price']
                    }, { transaction: t });

                    successfulAdditions++;
                    const productsCount = ((Object.keys(item).length - 6) / 4)
                    // Process each product
                    for (let i = 1; i <= productsCount; i++) {
                        if (item[`Product ${i} ID`]) {
                            await Oproduct.create({
                                orderId: order.orderId,
                                productId: item[`Product ${i} ID`],
                                productName: item[`Product ${i}`],
                                quantity: item[`Product ${i} Quantity`],
                                price: item[`Product ${i} Price`],
                                subEntity: item[`Sub-Entity`],
                            }, { transaction: t });
                        }
                    }
                }
            });
            let finalMessage = successfulAdditions > 0 ? `${successfulAdditions} orders added successfully.` : "";
            if (errorMessages.length > 0) {
                finalMessage = errorMessages.join('. ') + (finalMessage ? ' ' + finalMessage : '');
                return {
                    status: 400,
                    message: finalMessage
                };
            } else {
                return {
                    status: 200,
                    message: finalMessage
                };
            }
        } catch (error) {
            console.error('Error processing CSV file:', error);
            throw error;
        }
    }


    async processProductsCsvFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        const message = await this.uploadBulkProductsData(results);
                        resolve(message);  // Resolve the promise with the message
                    } catch (error) {
                        reject(error);  // Reject the promise on error
                    }
                })
                .on('error', (error) => {
                    console.error('Error reading the file:', error);
                    reject(error);  // Reject the promise on file reading error
                });
        });
    }


    async uploadBulkProductsData(data) {
        const errorMessages = [];
        let successfulAdditions = 0;

        try {
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                // Check if product with same name and subEntity exists
                const existingProduct = await Product.findOne({
                    where: {
                        productName: item[`Product Name`],
                        subEntity: item[`Sub Entity`]
                    }
                });

                if (existingProduct) {
                    errorMessages.push(`Row ${i + 1}: Product with name '${item[`Product Name`]}' and sub entity '${item[`Sub Entity`]}' already exists.`);
                } else {
                    await Product.create({
                        productName: item[`Product Name`],
                        subEntity: item[`Sub Entity`],
                        MRP: item[`MRP`] || "-" // Assuming MRP is optional
                    });
                    successfulAdditions++;
                }
            }

            let finalMessage = successfulAdditions > 0 ? `${successfulAdditions} product's added successfully.` : "";
            if (errorMessages.length > 0) {
                finalMessage += errorMessages.join(', ') + (finalMessage ? ' ' + finalMessage : '');
                return {
                    status: 400,
                    message: finalMessage
                };
            } else {
                return {
                    status: 200,
                    message: finalMessage
                };
            }
        } catch (error) {
            console.error('Error processing CSV file:', error);
            throw error;
        }
    }


}

module.exports = BulkUpload;