const { Store, Order, Oproduct } = require('../utils/Models/Models');


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
                        price: products[i].price,
                        subEntity: products[i].subEntity,
                    }, { transaction: t });
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