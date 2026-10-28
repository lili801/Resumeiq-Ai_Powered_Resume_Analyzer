function requireAdmin(req, res, next) {
    if (!req.currentUser || req.currentUser.role !== "admin") {
        return res.status(403).json({
            message: "Admin access required."
        })
    }

    next()
}

module.exports = { requireAdmin }
