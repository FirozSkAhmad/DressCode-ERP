const BulkUploadController = require('../controller/bulkupload_controller')
const OrdersController = require('../controller/orders_controller')
const adminController = require('../controller/admin_controller')
const UserController = require('../controller/users_controller')
const BillingController = require('../controller/billing_controller')


class IndexRoute {
    constructor(expressApp) {
        this.app = expressApp
    }

    async initialize() {
        this.app.use("/upload", BulkUploadController);
        this.app.use("/orders", OrdersController);
        this.app.use("/admin", adminController);
        this.app.use('/auth', UserController);
        this.app.use("/billing", BillingController);
    }
}

module.exports = IndexRoute;