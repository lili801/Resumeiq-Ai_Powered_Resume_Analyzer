const express = require("express")
const adminController = require("../controllers/admin.controller")
const adminMiddleware = require("../middlewares/admin.middleware")
const authMiddleware = require("../middlewares/auth.middleware")

const adminRouter = express.Router()

adminRouter.use(authMiddleware.authUser, adminMiddleware.requireAdmin)

adminRouter.get("/dashboard", adminController.getDashboardController)
adminRouter.get("/users", adminController.getUsersController)
adminRouter.patch("/users/:userId/block", adminController.updateUserBlockController)
adminRouter.delete("/users/:userId", adminController.deleteUserController)
adminRouter.get("/reports", adminController.getReportsController)
adminRouter.delete("/reports/:reportId", adminController.deleteReportController)
adminRouter.get("/ai-logs", adminController.getAiLogsController)
adminRouter.get("/resume-uploads", adminController.getResumeUploadsController)
adminRouter.get("/analytics", adminController.getAnalyticsController)

module.exports = adminRouter
