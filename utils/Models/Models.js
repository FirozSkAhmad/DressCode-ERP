const Sequelize = require('sequelize')


//SuperAdmin Model
const SuperAdmin = global.DATA.CONNECTION.mysql.define('superadmin', {
    userName: Sequelize.STRING,
    password: Sequelize.STRING,
    emailId: Sequelize.STRING,
    roleType: Sequelize.STRING,
});


// Store Model
const Store = global.DATA.CONNECTION.mysql.define('store', {
    storeId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    storeName: {
        type: Sequelize.STRING,
        unique: true
    },
    clientName: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
    },
    emailId: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
    },
    password: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    roleType: Sequelize.STRING,
});


// Order Model
const Order = global.DATA.CONNECTION.mysql.define('order', {
    orderId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    clientName: Sequelize.STRING,
    storeId: Sequelize.INTEGER,
    orderedDate: Sequelize.STRING,
    totalPrice: Sequelize.DECIMAL
});

// OProduct Model
const Oproduct = global.DATA.CONNECTION.mysql.define('oproduct', {
    oproductId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    orderId: Sequelize.INTEGER,
    productId: Sequelize.INTEGER,
    productName: Sequelize.STRING,
    subEntity: Sequelize.STRING,
    quantity: Sequelize.INTEGER,
    price: Sequelize.DECIMAL
});

//Product Model
const Product = global.DATA.CONNECTION.mysql.define('product', {
    productId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    productName: Sequelize.STRING,
    subEntity: Sequelize.STRING,
    MRP: Sequelize.STRING,
});

// Relationships
Store.hasMany(Order, { foreignKey: 'storeId', onDelete: 'CASCADE' });
Order.belongsTo(Store, { foreignKey: 'storeId' });
Order.hasMany(Oproduct, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Oproduct.belongsTo(Order, { foreignKey: 'orderId' });

global.DATA.CONNECTION.mysql.sync(); // This creates the table if it doesn't exist (and does nothing if it already exists)

module.exports = { SuperAdmin, Store, Order, Oproduct, Product };
