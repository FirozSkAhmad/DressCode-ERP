const { Store, Order, Oproduct } = require('../utils/Models/Models');
const { Op } = require('sequelize')

class OrdersService {
    constructor() {

    }
    async getOrders(storeName) {
        try {
            const store = await Store.findOne({
                where: { storeName: storeName },
                include: [{
                    model: Order,
                    include: [{
                        model: Oproduct,
                        attributes: ['productId', 'productName', 'size', 'quantity', 'price']
                    }]
                }]
            });

            if (!store) {
                return { message: 'Store not found' };
            }

            // Initialize an object to group orders by client name
            const ordersByClient = {};

            // Group orders by client name
            store.orders.forEach(order => {
                const clientName = order.clientName;
                if (!ordersByClient[clientName]) {
                    ordersByClient[clientName] = [];
                }
                ordersByClient[clientName].push({
                    orderId: order.orderId,
                    products: order.oproducts.map(prod => ({
                        product_id: prod.productId,
                        product_name: prod.productName,
                        size: prod.size,
                        quantity: prod.quantity,
                        price: prod.price
                    })),
                    ordered_date: order.orderedDate,
                    total_price: order.totalPrice
                });
            });

            // console.log(ordersByClient)

            // Convert the grouped orders into an array of objects
            const ordersArray = Object.keys(ordersByClient).map(clientName => {
                return {
                    client_name: clientName,
                    orders: ordersByClient[clientName]
                };
            });

            // Format the response
            const formattedResponse = {
                store_id: store.storeId,
                store_name: store.storeName,
                orders_by_client: ordersArray
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    }

    async getAllOfflineStores() {
        try {
            const stores = await Store.findAll({
                where: {
                    storeName: {
                        [Op.ne]: 'Shopify' // Exclude 'Shopify' store
                    }
                },
                include: [{
                    model: Order,
                    where: {
                        storeId: {
                            [Op.ne]: 1 // Exclude orders from storeId: 2
                        }
                    },
                    include: [{
                        model: Oproduct,
                        attributes: ['productId', 'productName', 'size', 'quantity', 'MRP']
                    }]
                }]
            });


            if (stores.length === 0) {
                return { stores: [] };
            }

            const storesData = stores.map(store => {
                // Map each order to the desired format
                console.log(store.orders)
                const orders = store.orders.map(order => (
                    {
                        orderId: order.orderId,
                        products: order.oproducts.map(prod => ({
                            product_id: prod.productId,
                            product_name: prod.productName,
                            size: prod.size,
                            quantity: prod.quantity,
                            MRP: prod.MRP
                        })),
                        ordered_date: order.orderedDate,
                        total_price: order.totalPrice
                    }));

                // Extract client name from the first order (assuming all orders have the same client)
                // const clientName = store.orders[0]?.clientName;

                return {
                    store_id: store.storeId,
                    store_name: store.storeName,
                    client_name: store.clientName, // Include the client name here
                    orders: orders
                };
            });

            // Format the response
            const formattedResponse = {
                stores: storesData
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error getting store data:', error);
            throw error;
        }
    }

    async getTotalOnlineSales() {
        try {
            const store = await Store.findOne({
                where: { storeName: "Shopify" },
                include: [{
                    model: Order,
                    attributes: ['totalPrice'] // Only fetch the totalPrice attribute
                }]
            });

            if (!store) {
                return { message: 'Store not found' };
            }

            // Calculate total sales by summing up the totalPrice of each order
            const totalSales = store.orders.reduce((total, order) => {
                return total + parseFloat(order.totalPrice);
            }, 0);

            // Format the response
            const formattedResponse = {
                store_id: store.storeId,
                store_name: store.storeName,
                total_online_sales: totalSales
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error calculating total sales:', error);
            throw error;
        }
    }

    async getTotalOfflineSales() {
        try {
            // Find all stores except those named 'Shopify'
            const stores = await Store.findAll({
                where: {
                    storeName: {
                        [Op.ne]: 'Shopify' // 'ne' stands for 'not equal'
                    }
                },
                include: [{
                    model: Order,
                    attributes: ['totalPrice']
                }]
            });

            let totalSales = 0;

            // Calculate total sales for all stores except 'Shopify'
            stores.forEach(store => {
                const storeTotal = store.orders.reduce((total, order) => {
                    return total + parseFloat(order.totalPrice);
                }, 0);

                totalSales += storeTotal;
            });

            // Format the response
            const formattedResponse = {
                total_offline_sales: totalSales
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error calculating total sales excluding Shopify:', error);
            throw error;
        }
    }

}

module.exports = OrdersService;