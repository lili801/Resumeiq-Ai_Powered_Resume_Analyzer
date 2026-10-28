const mongoose = require("mongoose")

const aiLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport"
    },
    action: {
        type: String,
        enum: [ "interview_report", "ats_analysis", "resume_pdf" ],
        required: true
    },
    status: {
        type: String,
        enum: [ "started", "success", "failed" ],
        required: true
    },
    message: {
        type: String,
        default: ""
    },
    error: {
        type: String,
        default: ""
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
})

const aiLogModel = mongoose.model("AiLog", aiLogSchema)

module.exports = aiLogModel
