const { Store, Order, Oproduct, Product } = require('../utils/Models/Models');
const { Op } = require('sequelize')


class BillingService {
    constructor() {

    }
    async createNewBill(payload) {
        try {
            let billingData = { ...payload };
    
            // The transaction result can be returned directly.
            return await global.DATA.CONNECTION.mysql.transaction(async (t) => {
    
                // Find store
                const store = await Store.findOne({
                    where: { storeName: billingData['storeName'], clientName: billingData['clientName'] },
                    transaction: t
                });
                
                // Ensure store is found before proceeding
                if (!store) {
                    throw new Error('Store not found.');
                }
    
                // Create order
                const order = await Order.create({
                    storeId: store.storeId,
                    clientName: store.clientName,
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