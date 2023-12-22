const Constants = require('../utils/Constants/response_messages')
const JWTHelper = require('../utils/Helpers/jwt_helper')
const { SuperAdmin, Store } = require('../utils/Models/Models');


class UserService {
    constructor() {
        this.jwtObject = new JWTHelper();
    }

    async loginUser(userDetails) {
        try {
            let user;
            if (userDetails.login_type === 'ADMIN') {
                user = await SuperAdmin.findOne({
                    "where": {
                        emailId: userDetails.emailId
                    }
                }).catch(err => {
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                })
            } else {
                user = await Store.findOne({
                    "where": {
                        emailId: userDetails.emailId
                    }
                }).catch(err => {
                    console.log(err.message)
                    throw new global.DATA.PLUGINS.httperrors.InternalServerError(Constants.SQL_ERROR)
                })
            }
            if (!user) {
                throw new global.DATA.PLUGINS.httperrors.NotFound("No user exists with given EmailId")
            }

            const userPassword = user.password;

            if (userDetails.login_type === 'ADMIN') {
                const isValid = await global.DATA.PLUGINS.bcrypt.compare(userDetails.password, userPassword);
                if (!isValid) {
                    throw new global.DATA.PLUGINS.httperrors.Unauthorized("Incorrect Password")
                }
            } else {
                const isValid = (userDetails.password === userPassword);
                if (!isValid) {
                    throw new global.DATA.PLUGINS.httperrors.Unauthorized("Incorrect Password")
                }
            }

            // Valid email and password
            const tokenPayload = userDetails.login_type === 'ADMIN'
                ? `${user.id}:${user.roleType}`
                : `${user.storeId}:${user.storeName}:${user.clientName}:${user.roleType}`;

            const accessToken = await this.jwtObject.generateAccessToken(tokenPayload);
            console.log(user)
            const data = {
                accessToken, "id": user.id, "email": user.emailId, "role_type": user.roleType, "clientName": user.clientName, "storeName": user.storeName
            }
            return data
        }
        catch (err) {
            throw err;
        }
    }
}
module.exports = UserService;