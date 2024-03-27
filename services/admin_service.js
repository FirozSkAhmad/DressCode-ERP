const Constants = require('../utils/Constants/response_messages')
const { SuperAdmin, Executive, Product } = require('../utils/Models/Models');
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

    async createExecutive(executiveDetails) {
        try {
            // Check if storeName, emailId, already exists
            const existingStores = await Executive.findAll({
                where: {
                    [Op.or]: [
                        { storeName: executiveDetails.executiveName },
                        { emailId: executiveDetails.emailId },
                    ]
                }
            });

            let errorMessage = [];
            // if (existingStores) {
            existingStores.forEach(executive => {
                if (executive.executiveName === executiveDetails.executiveName) {
                    errorMessage.push('Executiv name already exists');
                }
                if (executive.emailId === executiveDetails.emailId) {
                    errorMessage.push('Email ID already exists');
                }
            });
            // }

            if (errorMessage.length > 0) {
                throw new Error(errorMessage.join(', '));
            }

            // If unique, create the new store
            const newExecutive = await Executive.create({
                executiveName: executiveDetails.executiveName,
                emailId: executiveDetails.emailId,
                password: executiveDetails.password,
                roleType: executiveDetails.roleType,
            });

            return newExecutive;
        } catch (err) {
            console.error("Error in createExecutive:", err.message);
            throw new global.DATA.PLUGINS.httperrors.InternalServerError(err.message);
        }
    }


    async deleteExecutive(executiveDetails) {
        try {
            const executiveId = executiveDetails.executiveId;

            // Attempt to delete the store with the given storeId
            const result = await Store.update({ deleted: true }, {
                where: {
                    executiveId: executiveId
                }
            });

            if (result === 0) {
                // No store was deleted, which implies no store was found with the given storeId
                throw new global.DATA.PLUGINS.httperrors.NotFound('Executive not found');
            }

            return { message: 'Executive successfully deleted' };
        } catch (err) {
            console.error('Error deleting Executive:', err);
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


    async getAllExecutives() {
        try {
            // Retrieve all stores from the database except those with storeName 'Shopify'
            const executives = await Executive.findAll({
                where: {
                    // storeName: {
                    //     [Op.ne]: 'Shopify' // Sequelize.Op.ne stands for "not equal"
                    // },
                    deleted: false
                },
                attributes: ['executiveId', 'executiveName', 'emailId', 'password', 'roleType'] // Specify the fields you want to retrieve
            });

            return executives;
        } catch (error) {
            console.error('Error fetching executives:', error);
            throw error; // Propagate the error for further handling
        }
    }

}

module.exports = AdminService;