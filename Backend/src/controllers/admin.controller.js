const aiLogModel = require("../models/aiLog.model")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")

function getPagination(query) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100)
    const skip = (page - 1) * limit

    return { page, limit, skip }
}

function getPaginationMeta({ page, limit, total }) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
    }
}

async function getDashboardController(req, res) {
    const [ totalUsers, totalReports, scoreStats, recentReports, recentUsers, aiLogStats, recentAiLogs ] = await Promise.all([
        userModel.countDocuments(),
        interviewReportModel.countDocuments(),
        interviewReportModel.aggregate([
            {
                $group: {
                    _id: null,
                    averageAtsScore: { $avg: "$ats_score" }
                }
            }
        ]),
        interviewReportModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("title matchScore ats_score missing_skills user createdAt")
            .populate({ path: "user", model: "User", select: "username email" }),
        userModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("username email role isBlocked createdAt"),
        aiLogModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]),
        aiLogModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({ path: "user", model: "User", select: "username email" })
    ])

    res.status(200).json({
        message: "Admin dashboard fetched successfully.",
        dashboard: {
            totalUsers,
            totalReports,
            averageAtsScore: Math.round(scoreStats[ 0 ]?.averageAtsScore || 0),
            aiLogs: aiLogStats.reduce((acc, item) => {
                acc[ item._id ] = item.count
                return acc
            }, {}),
            recentReports,
            recentUsers,
            recentAiLogs
        }
    })
}

async function getUsersController(req, res) {
    const { page, limit, skip } = getPagination(req.query)
    const search = req.query.search?.trim()
    const filter = search
        ? {
            $or: [
                { username: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ]
        }
        : {}

    const [ users, total ] = await Promise.all([
        userModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-password"),
        userModel.countDocuments(filter)
    ])

    res.status(200).json({
        message: "Users fetched successfully.",
        users,
        pagination: getPaginationMeta({ page, limit, total })
    })
}

async function updateUserBlockController(req, res) {
    const { userId } = req.params
    const { isBlocked } = req.body

    const user = await userModel.findByIdAndUpdate(
        userId,
        { isBlocked: Boolean(isBlocked) },
        { new: true }
    ).select("-password")

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        })
    }

    res.status(200).json({
        message: user.isBlocked ? "User blocked successfully." : "User unblocked successfully.",
        user
    })
}

async function deleteUserController(req, res) {
    const { userId } = req.params

    if (String(req.currentUser._id) === userId) {
        return res.status(400).json({
            message: "Admins cannot delete their own account."
        })
    }

    const user = await userModel.findByIdAndDelete(userId)

    if (!user) {
        return res.status(404).json({
            message: "User not found."
        })
    }

    res.status(200).json({
        message: "User deleted successfully."
    })
}

async function getReportsController(req, res) {
    const { page, limit, skip } = getPagination(req.query)
    const search = req.query.search?.trim()
    const filter = search
        ? {
            $or: [
                { title: { $regex: search, $options: "i" } },
                { jobDescription: { $regex: search, $options: "i" } },
                { missing_skills: { $regex: search, $options: "i" } }
            ]
        }
        : {}

    const [ reports, total ] = await Promise.all([
        interviewReportModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-resume -selfDescription -jobDescription -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -__v")
            .populate({ path: "user", model: "User", select: "username email" }),
        interviewReportModel.countDocuments(filter)
    ])

    res.status(200).json({
        message: "Reports fetched successfully.",
        reports,
        pagination: getPaginationMeta({ page, limit, total })
    })
}

async function deleteReportController(req, res) {
    const { reportId } = req.params
    const report = await interviewReportModel.findByIdAndDelete(reportId)

    if (!report) {
        return res.status(404).json({
            message: "Report not found."
        })
    }

    res.status(200).json({
        message: "Report deleted successfully."
    })
}

async function getAiLogsController(req, res) {
    const { page, limit, skip } = getPagination(req.query)
    const status = req.query.status?.trim()
    const filter = status ? { status } : {}

    const [ logs, total ] = await Promise.all([
        aiLogModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate({ path: "user", model: "User", select: "username email" })
            .populate({ path: "report", model: "InterviewReport", select: "title matchScore ats_score" }),
        aiLogModel.countDocuments(filter)
    ])

    res.status(200).json({
        message: "AI logs fetched successfully.",
        logs,
        pagination: getPaginationMeta({ page, limit, total })
    })
}

async function getResumeUploadsController(req, res) {
    const { page, limit, skip } = getPagination(req.query)

    const [ uploads, total ] = await Promise.all([
        interviewReportModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("title matchScore ats_score user createdAt")
            .populate({ path: "user", model: "User", select: "username email" }),
        interviewReportModel.countDocuments()
    ])

    res.status(200).json({
        message: "Resume uploads fetched successfully.",
        uploads,
        pagination: getPaginationMeta({ page, limit, total })
    })
}

async function getAnalyticsController(req, res) {
    const [ reportsPerDay, scoreDistribution, missingSkills ] = await Promise.all([
        interviewReportModel.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            { $limit: 30 }
        ]),
        interviewReportModel.aggregate([
            {
                $bucket: {
                    groupBy: "$ats_score",
                    boundaries: [ 0, 40, 60, 80, 101 ],
                    default: "unknown",
                    output: { count: { $sum: 1 } }
                }
            }
        ]),
        interviewReportModel.aggregate([
            { $unwind: "$missing_skills" },
            {
                $group: {
                    _id: "$missing_skills",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ])
    ])

    res.status(200).json({
        message: "Analytics fetched successfully.",
        analytics: {
            reportsPerDay: reportsPerDay.map(item => ({
                date: item._id,
                count: item.count
            })),
            atsScoreDistribution: scoreDistribution.map(item => ({
                range: item._id === "unknown" ? "unknown" : `${item._id}-${item._id === 80 ? 100 : item._id + 19}`,
                count: item.count
            })),
            mostCommonMissingSkills: missingSkills.map(item => ({
                skill: item._id,
                count: item.count
            }))
        }
    })
}

module.exports = {
    getDashboardController,
    getUsersController,
    updateUserBlockController,
    deleteUserController,
    getReportsController,
    deleteReportController,
    getAiLogsController,
    getResumeUploadsController,
    getAnalyticsController
}
