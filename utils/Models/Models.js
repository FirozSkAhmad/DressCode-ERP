const Sequelize = require('sequelize')


//SuperAdmin Model
const SuperAdmin = global.DATA.CONNECTION.mysql.define('superadmin', {
    userName: Sequelize.STRING,
    password: Sequelize.STRING,
    emailId: Sequelize.STRING,
    roleType: Sequelize.STRING,
});


// Executive Model
const Executive = global.DATA.CONNECTION.mysql.define('executive', {
    executiveId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    executiveName: {
        type: Sequelize.STRING,
        unique: true
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
    roleType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "EXECUTIVE"
    },
    deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
});


// Order Model
const Order = global.DATA.CONNECTION.mysql.define('order', {
    orderId: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    studentName: Sequelize.STRING,
    class: Sequelize.STRING,
    roll_no: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    email_id: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    phn_no: Sequelize.STRING,
    executiveId: Sequelize.INTEGER,
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
    executiveId: Sequelize.INTEGER,
    productId: Sequelize.INTEGER,
    productName: Sequelize.STRING,
    size: Sequelize.STRING,
    quantity: Sequelize.INTEGER,
    MRP: Sequelize.DECIMAL
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
    size: Sequelize.STRING,
    MRP: Sequelize.INTEGER,
    quantity: Sequelize.INTEGER,
});

// Relationships
Executive.hasMany(Order, { foreignKey: 'executiveId', onDelete: 'CASCADE' });
Order.belongsTo(Executive, { foreignKey: 'executiveId' });
Order.hasMany(Oproduct, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Oproduct.belongsTo(Order, { foreignKey: 'orderId' });

global.DATA.CONNECTION.mysql.sync(); // This creates the table if it doesn't exist (and does nothing if it already exists)

module.exports = { SuperAdmin, Executive, Order, Oproduct, Product };
