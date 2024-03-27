const { Executive, Order, Oproduct } = require('../utils/Models/Models');
const { Op } = require('sequelize')

class OrdersService {
    constructor() {

    }
    async getOrders(executiveName) {
        try {
            const executive = await Executive.findOne({
                where: { executiveName: executiveName, deleted: false },
                include: [{
                    model: Order,
                    include: [{
                        model: Oproduct,
                        attributes: ['productId', 'productName', 'size', 'quantity', 'MRP']
                    }]
                }]
            });

            if (!executive) {
                return { message: 'Executive not found' };
            }

            // Initialize an object to group orders by client name
            const ordersByClient = {};

            // Group orders by client name
            executive.orders.forEach(order => {
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
                executive_id: executive.executiveId,
                executive_name: executive.executiveName,
                orders_by_client: ordersArray
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error getting orders:', error);
            throw error;
        }
    }

    async getAllOfflineExecutives() {
        try {
            const executives = await Executive.findAll({
                where: {
                    executiveName: {
                        [Op.ne]: 'Shopify' // Exclude 'Shopify' executive
                    },
                    deleted: false
                },
                include: [{
                    model: Order,
                    where: {
                        executiveId: {
                            [Op.ne]: 1 // Exclude orders from executiveId: 2
                        }
                    },
                    include: [{
                        model: Oproduct,
                        attributes: ['productId', 'productName', 'size', 'quantity', 'MRP']
                    }]
                }]
            });


            if (executives.length === 0) {
                return { executives: [] };
            }

            const executivesData = executives.map(executive => {
                // Map each order to the desired format
                const orders = executive.orders.map(order => (
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
                // const clientName = executive.orders[0]?.clientName;

                return {
                    executive_id: executive.executiveId,
                    executive_name: executive.executiveName,
                    orders: orders
                };
            });

            // Format the response
            const formattedResponse = {
                executives: executivesData
            };

            return formattedResponse;
        } catch (error) {
            console.error('Error getting executive data:', error);
            throw error;
        }
    }

    async getTotalOnlineSales() {
        try {
            const executive = await Executive.findOne({
                where: { executiveName: "Shopify" },
                include: [{
                    model: Order,
                    attributes: ['totalPrice'] // Only fetch the totalPrice attribute
                }]
            });

            if (!executive) {
                return { message: 'executive not found' };
            }

            // Calculate total sales by summing up the totalPrice of each order
            const totalSales = executive.orders.reduce((total, order) => {
                return total + parseFloat(order.totalPrice);
            }, 0);

            // Format the response
            const formattedResponse = {
                executive_id: executive.executiveId,
                executive_name: executive.executiveName,
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
            // Find all executives except those named 'Shopify'
            const executives = await Executive.findAll({
                where: {
                    executiveName: {
                        [Op.ne]: 'Shopify' // 'ne' stands for 'not equal'
                    },
                    deleted: false
                },
                include: [{
                    model: Order,
                    attributes: ['totalPrice']
                }]
            });

            let totalSales = 0;

            // Calculate total sales for all executives except 'Shopify'
            executives.forEach(executive => {
                const executiveTotal = executive.orders.reduce((total, order) => {
                    return total + parseFloat(order.totalPrice);
                }, 0);

                totalSales += executiveTotal;
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