const fs = require('fs');
const csv = require('csv-parser');
const stream = require('stream');
const { Executive, Order, Oproduct, Product } = require('../utils/Models/Models');

class BulkUpload {
    constructor() {

    }
    async processOnlineSalesCsvFile(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];
            const nonShopifyRows = [];

            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        // Check each row and record non-Shopify rows
                        results.forEach((item, index) => {
                            if (item['Executive Name'] !== 'Shopify') {
                                nonShopifyRows.push({ row: index + 1, "Executive Name": item['Executive Name'] });
                            }
                        });

                        if (nonShopifyRows.length > 0) {
                            const errorMessage = nonShopifyRows.map(row => `Row ${row.row}: ${row['Executive Name']}`).join(', ');
                            // Create a custom error object with a status code
                            const error = new Error(`Rows with non-Shopify executive names:- ${errorMessage}`);
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

                    // Find executive
                    const executive = await Executive.findOne({
                        where: { executiveName: item['Executive Name'] },
                        transaction: t
                    });

                    if (!executive) {
                        errorMessages.push(`Row ${i + 1}: Executive named '${item['Executive Name']}' not found.`);
                        continue; // Skip this iteration
                    }

                    // Create order
                    const order = await Order.create({
                        executiveId: executive.executiveId,
                        studentName: item['Student Name'],
                        class: item['Class'],
                        roll_no: item['Roll No'] || null,
                        phn_no: item['Phone No'],
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
                                size: item[`SIZE`],
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


    async processOfflineSalesCsvFile(buffer, executiveName) {
        return new Promise((resolve, reject) => {
            const results = [];
            const nonMatchingRows = [];

            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        // Check each row and record rows with non-matching executive
                        results.forEach((item, index) => {
                            let mismatchDetails = [];
                            if (item['Executive Name'] !== executiveName) {
                                mismatchDetails.push(`Executive - ${item['Executive Name']} (expected: ${executiveName})`);
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

                    // Find executive
                    const executive = await Executive.findOne({
                        where: { executiveName: item['Executive Name'] },
                        transaction: t
                    });

                    if (!executive) {
                        errorMessages.push(`Row ${i + 1}: Executive named '${item['Executive Name']}' not found.`);
                        continue; // Skip this iteration
                    }

                    // Create order
                    const order = await Order.create({
                        executiveId: executive.executiveId,
                        studentName: item['Student Name'],
                        class: item['Class'],
                        roll_no: item['Roll No'] || null,
                        phn_no: item['Phone No'],
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
                                size: item[`SIZE`],
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


    async processProductsCsvFile(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];

            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
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

    async processProductsToUpdateCsvFile(buffer) {
        return new Promise((resolve, reject) => {
            const results = [];

            // Create a readable stream from the buffer
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            bufferStream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        const message = await this.updateProductsData(results);
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
                // Check if product with same name and size exists
                const existingProduct = await Product.findOne({
                    where: {
                        productName: item[`Product Name`],
                        size: item[`SIZE`]
                    }
                });

                if (existingProduct) {
                    errorMessages.push(`Row ${i + 1}: Product with name '${item[`Product Name`]}' and size '${item[`SIZE`]}' already exists.`);
                } else {
                    await Product.create({
                        productName: item[`Product Name`],
                        size: item[`SIZE`],
                        MRP: item[`MRP`] || "-", // Assuming MRP is optional
                        quantity: item[`QUANTITY`] || "-"
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
            console.error('Error processing processing data:', error);
            throw error;
        }
    }

    async updateProductsData(data) {
        const errorMessages = [];

        // Start a new transaction
        const transaction = await Product.sequelize.transaction();
        try {
            let successfulUpdates = 0; // Move successfulUpdates here to reset it on each transaction attempt

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                // Check if the product with the given ID exists
                const existingProduct = await Product.findOne({
                    where: {
                        productId: item['Product ID'],
                    },
                    transaction: transaction,
                });

                if (!existingProduct) {
                    errorMessages.push(`Row ${i + 1}: Product with Product ID '${item['Product ID']}' doesn't exist.`);
                } else {
                    // Assuming existingProduct.quantity is the current quantity
                    await Product.update(
                        { quantity: existingProduct.quantity + parseInt(item['Quantity to add'], 10) },
                        { where: { productId: item['Product ID'] }, transaction: transaction }
                    );
                    successfulUpdates++;
                }
            }

            // If there are any errors, rollback the transaction and reset successfulUpdates
            if (errorMessages.length > 0) {
                await transaction.rollback();
                successfulUpdates = 0; // Reset successfulUpdates as the transaction is rolled back
            } else {
                // If everything went fine, commit the transaction
                await transaction.commit();
            }

            // Construct the final message
            let finalMessage = successfulUpdates > 0 ? `${successfulUpdates} ${successfulUpdates == 1 ? 'product' : 'products'} updated successfully. ` : "";
            if (errorMessages.length > 0) {
                finalMessage = errorMessages.join(', ') + 'So please check Produt IDs in file that you uploaded';
                return {
                    status: 400,
                    message: finalMessage
                };
            } else {
                return {
                    status: 200,
                    message: finalMessage.trim()
                };
            }
        } catch (error) {
            console.error('Error processing data:', error);
            // Ensure the transaction is rolled back in case of an error
            await transaction.rollback();
            throw error; // Consider formatting this error into a more user-friendly message
        }
    }



}

module.exports = BulkUpload;