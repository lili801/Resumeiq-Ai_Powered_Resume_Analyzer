require("dotenv").config()

const mongoose = require("mongoose")
const Report = require("../src/models/interviewReport.model")
const { generateAtsAnalysisFields } = require("../src/services/ai.service")

function hasItems(value) {
    return Array.isArray(value) && value.filter(Boolean).length > 0
}

function buildFallbackStrengths(report) {
    if (report.matchScore >= 70) {
        return [
            "Relevant experience aligned with the target role requirements",
            "Demonstrated technical foundation suitable for interview progression",
            "Clear potential to close identified gaps with focused preparation"
        ]
    }

    return [
        "Foundational profile alignment with selected job requirements",
        "Resume provides enough context for targeted interview preparation",
        "Ability to improve role fit through structured preparation"
    ]
}

function buildFallbackWeaknesses(report) {
    const skills = (report.skillGaps || []).map(gap => gap.skill).filter(Boolean)

    if (skills.length > 0) {
        return skills.slice(0, 3).map(skill => `Needs stronger ${skill} evidence`)
    }

    return [
        "Need clearer evidence of Enterprise Experience",
        "Need stronger Architecture and delivery ownership examples"
    ]
}

async function main() {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 60000 })

    const reports = await Report.find({
        $or: [
            { ats_score: { $exists: false } },
            { strengths: { $in: [ [], null ] } },
            { weaknesses: { $in: [ [], null ] } },
            { missing_skills: { $in: [ [], null ] } }
        ]
    })

    let updated = 0

    for (const report of reports) {
        let changed = false

        if (report.resume && report.jobDescription) {
            try {
                const generatedAnalysis = await generateAtsAnalysisFields({
                    resume: report.resume,
                    selfDescription: report.selfDescription,
                    jobDescription: report.jobDescription,
                    matchScore: report.matchScore,
                    skillGaps: report.skillGaps
                })

                report.ats_score = generatedAnalysis.ats_score
                report.strengths = generatedAnalysis.strengths
                report.weaknesses = generatedAnalysis.weaknesses
                report.missing_skills = generatedAnalysis.missing_skills
                changed = true
            } catch (error) {
                console.error(`AI backfill failed for ${report._id}:`, error.message || error)
            }
        }

        if (!changed) {
            if (typeof report.ats_score !== "number") {
                report.ats_score = report.matchScore || 0
                changed = true
            }

            if (!hasItems(report.strengths)) {
                report.strengths = buildFallbackStrengths(report)
                changed = true
            }

            if (!hasItems(report.weaknesses)) {
                report.weaknesses = buildFallbackWeaknesses(report)
                changed = true
            }

            if (!hasItems(report.missing_skills)) {
                report.missing_skills = (report.skillGaps || [])
                    .map(gap => gap.skill)
                    .filter(Boolean)
                    .slice(0, 8)
                changed = true
            }
        }

        if (changed) {
            await report.save()
            updated += 1
        }
    }

    console.log(JSON.stringify({ updated }, null, 2))
    await mongoose.disconnect()
}

main().catch(async (error) => {
    console.error(error)
    await mongoose.disconnect()
    process.exit(1)
})
