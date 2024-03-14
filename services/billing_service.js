const { Store, Order, Oproduct, Product } = require('../utils/Models/Models');
const { Op } = require('sequelize')


class BillingService {
    constructor() {

    }
    async createNewBill(payload) {
        try {
            let billingData = { ...payload };

            await global.DATA.CONNECTION.mysql.transaction(async (t) => {

                // Find store
                const store = await Store.findOne({
                    where: { storeName: billingData['storeName'], clientName: billingData['clientName'] },
                    transaction: t
                });
                // Create order
                const order = await Order.create({
                    storeId: store.storeId,
                    clientName: store.clientName,
                    orderedDate: billingData['orderedDate'],
                    totalPrice: billingData['totalPrice']
                }, { transaction: t });

                const products = billingData['products']
                // Process each product
                for (let i = 0; i < products?.length; i++) {
                    await Oproduct.create({
                        orderId: order.orderId,
                        productId: products[i].productId,
                        productName: products[i].productName,
                        quantity: products[i].quantity,
                        MRP: products[i].MRP,
                        size: products[i].size,
                    }, { transaction: t });

                    await Product.decrement(
                        { quantity: products[i].quantity },
                        {
                            where: {
                                productId: products[i].productId,
                                quantity: { [Op.gte]: products[i].quantity } // Ensure there's enough quantity
                            },
                            transaction: t
                        }
                    );
                }
            });

            return {
                message: "Billing created successfully",
            };
        } catch (err) {
            console.log(err.message);
            throw err;
        }
    }
}

module.exports = BillingService;