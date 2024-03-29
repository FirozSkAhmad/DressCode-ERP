const { Executive, Order, Oproduct, Product } = require('../utils/Models/Models');
const { Op } = require('sequelize')


class BillingService {
    constructor() {

    }
    async createNewBill(payload, executiveId) {
        try {
            let billingData = { ...payload };

            // The transaction result can be returned directly.
            return await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                // Find executive
                const executive = await Executive.findOne({
                    where: { executiveId: executiveId },
                    transaction: t
                });

                // Ensure executive is found before proceeding
                if (!executive) {
                    throw new Error('Executive not found.');
                }

                // Create order
                const order = await Order.create({
                    executiveId: executiveId,
                    studentName: billingData['studentName'],
                    class: billingData['class'],
                    email_id: billingData['emailId'],
                    roll_no: billingData['rollNo'] || null,
                    phn_no: billingData['phnNo'],
                    mode_of_payment: billingData['modeOfPayment'],
                    orderedDate: billingData['orderedDate'],
                    totalPrice: billingData['totalPrice']
                }, { transaction: t });

                const products = billingData['products'];
                // Process each product
                for (let i = 0; i < products?.length; i++) {
                    await Oproduct.create({
                        orderId: order.orderId,
                        productId: products[i].productId,
                        productName: products[i].productName,
                        quantity: products[i].quantity,
                        MRP: products[i].price,
                        size: products[i].size,
                    }, { transaction: t });

                    const result = await Product.decrement(
                        { quantity: products[i].quantity },
                        {
                            where: {
                                productId: products[i].productId,
                                quantity: { [Op.gte]: products[i].quantity } // Ensure there's enough quantity
                            },
                            transaction: t
                        }
                    );

                    // Check if decrement was successful (optional)
                    if (result[0][0] <= 0) {
                        throw new Error('Not enough quantity for product ID ' + products[i].productId);
                    }
                }

                // If all operations complete successfully, return the result
                return {
                    orderId: order.orderId,
                    message: "Billing created successfully",
                };
            });
        } catch (err) {
            console.log(err.message);
            throw err;
        }
    }

}

module.exports = BillingService;