const Constants = require('../utils/Constants/response_messages')
const { SuperAdmin, Store, Product } = require('../utils/Models/Models');
const { Op } = require('sequelize')



class AdminService {
    constructor() {

    }

    async createSuperAdmin(userdetails) {
        try {
            const password = userdetails.password;

            const randomkey = await global.DATA.PLUGINS.bcrypt.genSalt(10);
            const hashedPassword = await global.DATA.PLUGINS.bcrypt.hash(password, randomkey)

            const userPayload = {
                emailId: userdetails.emailId,
                password: hashedPassword,
                userName: userdetails.userName,
                roleType: userdetails.roleType,
            }

            const newUser = SuperAdmin.create(userPayload).catch(err => {
                console.log("Error while adding in userstatus table", err.message);
                throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR);
            });
            return newUser
        }
        catch (err) {
            throw err;
        }
    }

    async createStore(storeDetails) {
        try {
            // Check if storeName, emailId, or clientName already exists
            const existingStores = await Store.findAll({
                where: {
                    [Op.or]: [
                        { storeName: storeDetails.storeName },
                        { emailId: storeDetails.emailId },
                        { clientName: storeDetails.clientName }
                    ]
                }
            });

            let errorMessage = [];
            // if (existingStores) {
            existingStores.forEach(store => {
                if (store.storeName === storeDetails.storeName) {
                    errorMessage.push('Store name already exists');
                }
                if (store.emailId === storeDetails.emailId) {
                    errorMessage.push('Email ID already exists');
                }
                if (store.clientName === storeDetails.clientName) {
                    errorMessage.push('Client name already exists');
                }
            });
            // }

            if (errorMessage.length > 0) {
                throw new Error(errorMessage.join(', '));
            }

            // If unique, create the new store
            const newStore = await Store.create({
                storeName: storeDetails.storeName,
                emailId: storeDetails.emailId,
                password: storeDetails.password,
                clientName: storeDetails.clientName,
                roleType: storeDetails.roleType,
            });

            return newStore;
        } catch (err) {
            console.error("Error in createStore:", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message);
        }
    }


    async deleteStore(storedetails) {
        try {
            const storeId = storedetails.storeId;

            // Attempt to delete the store with the given storeId
            const result = await Store.update({ deleted: true }, {
                where: {
                    storeId: storeId
                }
            });

            if (result === 0) {
                // No store was deleted, which implies no store was found with the given storeId
                throw new global.DATA.PLUGINS.httperrors.NotFound('Store not found');
            }

            return { message: 'Store successfully deleted' };
        } catch (err) {
            console.error('Error deleting store:', err);
            throw err; // Propagate the error for further handling
        }
    }

    async getAllProducts() {
        try {
            const products = await Product.findAll();
            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    }

    async getAllProductNames() {
        try {
            const products = await Product.findAll({
                where: {
                    quantity: {
                        [Op.gt]: 0 // Use the "greater than" operator
                    }
                }
            });

            // Check if there are no products
            if (products.length === 0) {
                return []; // Return an empty array if no products are found
            }

            const productNames = products.map(product => product.productName);

            // Remove duplicates using Set
            const uniqueProductNames = [...new Set(productNames)];

            return uniqueProductNames;
        } catch (error) {
            console.error('Error fetching product names:', error);
            throw error;
        }
    }

    async getProductSizes(productName) {
        try {
            const products = await Product.findAll({
                where: {
                    productName: productName,
                    quantity: {
                        [Op.gt]: 0 // Use the "greater than" operator
                    }
                }
            });

            // Extract the subEntity values
            const sizes = products.map(product => product.size);

            // Optionally, remove duplicates if needed
            const uniqueSizes = [...new Set(sizes)];

            return uniqueSizes;
        } catch (error) {
            console.error('Error fetching sizes', error);
            throw error;
        }
    }

    async getProductIdByProductNameAndSize(productName, size) {
        try {
            const product = await Product.findOne({
                where: {
                    productName: productName,
                    size: size
                },
                attributes: ['productId'] // Fetch only the productId
            });

            if (!product) {
                throw new Error('Product not found');
            }

            return product.productId;
        } catch (error) {
            console.error('Error fetching product ID:', error);
            throw error;
        }
    }

    async getPriceAndQuantityByProductId(productId) {
        try {
            const productDetatils = await Product.findOne({
                where: {
                    productId: productId
                },
                attributes: ['MRP', 'quantity'] // Fetch only the productId
            });

            if (!productDetatils) {
                throw new Error('Product not found');
            }

            return productDetatils;
        } catch (error) {
            console.error('Error fetching product ID:', error);
            throw error;
        }
    }

    async getProductDetails(productId) {
        try {
            // Retrieve a product by its productId
            const product = await Product.findOne({
                where: {
                    productId: productId
                }
            });

            // Check if product was found
            if (!product) {
                throw new Error('Product not found');
            }

            return product;
        } catch (error) {
            console.error('Error fetching product details:', error);
            throw error; // Propagate the error for further handling
        }
    }


    async getAllStores() {
        try {
            // Retrieve all stores from the database except those with storeName 'Shopify'
            const stores = await Store.findAll({
                where: {
                    storeName: {
                        [Op.ne]: 'Shopify' // Sequelize.Op.ne stands for "not equal"
                    },
                    deleted: false
                },
                attributes: ['storeId', 'storeName', 'clientName', 'emailId', 'password', 'roleType'] // Specify the fields you want to retrieve
            });

            return stores;
        } catch (error) {
            console.error('Error fetching stores:', error);
            throw error; // Propagate the error for further handling
        }
    }

}

module.exports = AdminService;