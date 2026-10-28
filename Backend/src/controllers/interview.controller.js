const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateAtsAnalysisFields, generateResumePdf } = require("../services/ai.service")
const aiLogModel = require("../models/aiLog.model")
const interviewReportModel = require("../models/interviewReport.model")


function getFallbackTitle(jobDescription) {
    const firstLine = jobDescription
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(Boolean)

    return firstLine ? firstLine.slice(0, 80) : "Custom Interview Plan"
}

function hasItems(value) {
    return Array.isArray(value) && value.filter(Boolean).length > 0
}

async function safeLogAiEvent(logData) {
    try {
        await aiLogModel.create(logData)
    } catch (error) {
        console.error("AI log write failed:", error.message || error)
    }
}

function buildFallbackStrengths(interviewReport) {
    const skillNames = (interviewReport.skillGaps || []).map(gap => gap.skill).filter(Boolean)

    if (interviewReport.matchScore >= 70) {
        return [
            "Relevant experience aligned with the target role requirements",
            "Demonstrated technical foundation suitable for interview progression",
            "Clear potential to close identified gaps with focused preparation"
        ]
    }

    return [
        "Foundational profile alignment with selected job requirements",
        "Resume provides enough context for targeted interview preparation",
        skillNames.length > 0 ? `Awareness of priority improvement area: ${skillNames[ 0 ]}` : "Ability to improve role fit through structured preparation"
    ]
}

function buildFallbackWeaknesses(interviewReport) {
    const skillNames = (interviewReport.skillGaps || []).map(gap => gap.skill).filter(Boolean)

    if (skillNames.length > 0) {
        return skillNames.slice(0, 3).map(skill => `Needs stronger ${skill} evidence`)
    }

    return [
        "Need clearer evidence of Enterprise Experience",
        "Need stronger Architecture and delivery ownership examples"
    ]
}

async function ensureAnalysisFields(interviewReport) {
    let changed = false
    const needsGeneratedAnalysis =
        typeof interviewReport.ats_score !== "number" ||
        !hasItems(interviewReport.strengths) ||
        !hasItems(interviewReport.weaknesses) ||
        !hasItems(interviewReport.missing_skills)

    if (needsGeneratedAnalysis && interviewReport.resume && interviewReport.jobDescription) {
        try {
            const generatedAnalysis = await generateAtsAnalysisFields({
                resume: interviewReport.resume,
                selfDescription: interviewReport.selfDescription,
                jobDescription: interviewReport.jobDescription,
                matchScore: interviewReport.matchScore,
                skillGaps: interviewReport.skillGaps
            })

            interviewReport.ats_score = generatedAnalysis.ats_score
            interviewReport.strengths = generatedAnalysis.strengths
            interviewReport.weaknesses = generatedAnalysis.weaknesses
            interviewReport.missing_skills = generatedAnalysis.missing_skills
            await interviewReport.save()
            return interviewReport
        } catch (error) {
            console.error("ATS analysis backfill failed:", error.message || error)
        }
    }

    if (typeof interviewReport.ats_score !== "number") {
        interviewReport.ats_score = interviewReport.matchScore || 0
        changed = true
    }

    if (!hasItems(interviewReport.strengths)) {
        interviewReport.strengths = buildFallbackStrengths(interviewReport)
        changed = true
    }

    if (!hasItems(interviewReport.weaknesses)) {
        interviewReport.weaknesses = buildFallbackWeaknesses(interviewReport)
        changed = true
    }

    if (!hasItems(interviewReport.missing_skills)) {
        interviewReport.missing_skills = (interviewReport.skillGaps || [])
            .map(gap => gap.skill)
            .filter(Boolean)
            .slice(0, 8)
        changed = true
    }

    if (changed) {
        await interviewReport.save()
    }

    return interviewReport
}

async function ensureCompleteInterviewReport(interviewReport) {
    const needsGeneratedAnalysis =
        typeof interviewReport.ats_score !== "number" ||
        !hasItems(interviewReport.strengths) ||
        !hasItems(interviewReport.weaknesses) ||
        !hasItems(interviewReport.missing_skills)

    if (!needsGeneratedAnalysis) {
        return interviewReport
    }

    const generatedAnalysis = await generateAtsAnalysisFields({
        resume: interviewReport.resume,
        selfDescription: interviewReport.selfDescription,
        jobDescription: interviewReport.jobDescription,
        matchScore: interviewReport.matchScore,
        skillGaps: interviewReport.skillGaps
    })

    return {
        ...interviewReport,
        ats_score: generatedAnalysis.ats_score,
        strengths: generatedAnalysis.strengths,
        weaknesses: generatedAnalysis.weaknesses,
        missing_skills: generatedAnalysis.missing_skills
    }
}



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    const { selfDescription = "", jobDescription = "" } = req.body

    if (!jobDescription.trim()) {
        return res.status(400).json({
            message: "Job description is required."
        })
    }

    if (!req.file) {
        return res.status(400).json({
            message: "Resume PDF is required."
        })
    }

    if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
            message: "Only PDF resumes are supported."
        })
    }

    let resumeContent = ""

    const parsedResume = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    resumeContent = parsedResume.text

    await safeLogAiEvent({
        user: req.user.id,
        action: "interview_report",
        status: "started",
        message: "Interview report generation started."
    })

    let interViewReportByAi

    try {
        interViewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        })
    } catch (error) {
        await safeLogAiEvent({
            user: req.user.id,
            action: "interview_report",
            status: "failed",
            message: "Interview report generation failed.",
            error: error.message || "Unknown Gemini error"
        })

        throw error
    }

    const completeInterviewReport = await ensureCompleteInterviewReport({
        ...interViewReportByAi,
        jobDescription,
        resume: resumeContent,
        selfDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent,
        selfDescription,
        jobDescription,
        title: completeInterviewReport.title || getFallbackTitle(jobDescription),
        matchScore: completeInterviewReport.matchScore,
        ats_score: completeInterviewReport.ats_score,
        strengths: completeInterviewReport.strengths,
        weaknesses: completeInterviewReport.weaknesses,
        missing_skills: completeInterviewReport.missing_skills,
        technicalQuestions: completeInterviewReport.technicalQuestions,
        behavioralQuestions: completeInterviewReport.behavioralQuestions,
        skillGaps: completeInterviewReport.skillGaps,
        preparationPlan: completeInterviewReport.preparationPlan
    })

    await ensureAnalysisFields(interviewReport)

    await safeLogAiEvent({
        user: req.user.id,
        report: interviewReport._id,
        action: "interview_report",
        status: "success",
        message: "Interview report generated successfully.",
        metadata: {
            matchScore: interviewReport.matchScore,
            ats_score: interviewReport.ats_score
        }
    })

    res.status(201).json({
        message: "Interview report generated successfully.",
        interviewReport
    })

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    let interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    interviewReport = await ensureAnalysisFields(interviewReport)

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findOne({
        _id: interviewReportId,
        user: req.user.id
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    await safeLogAiEvent({
        user: req.user.id,
        report: interviewReport._id,
        action: "resume_pdf",
        status: "started",
        message: "Resume PDF generation started."
    })

    let pdfBuffer

    try {
        pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })
    } catch (error) {
        await safeLogAiEvent({
            user: req.user.id,
            report: interviewReport._id,
            action: "resume_pdf",
            status: "failed",
            message: "Resume PDF generation failed.",
            error: error.message || "Unknown Gemini error"
        })

        throw error
    }

    await safeLogAiEvent({
        user: req.user.id,
        report: interviewReport._id,
        action: "resume_pdf",
        status: "success",
        message: "Resume PDF generated successfully."
    })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController }
