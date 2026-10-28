const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const userModel = require("../models/user.model")



async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.id).select("-password")

        if (!user || user.isBlocked || user.isVerified === false) {
            return res.status(401).json({
                message: "User account is not available."
            })
        }

        req.user = decoded
        req.currentUser = user

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}


module.exports = { authUser }
