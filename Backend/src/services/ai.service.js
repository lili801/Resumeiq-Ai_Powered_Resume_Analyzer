const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportResponseSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        matchScore: { type: "number" },
        technicalQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: [ "question", "intention", "answer" ]
            }
        },
        behavioralQuestions: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    question: { type: "string" },
                    intention: { type: "string" },
                    answer: { type: "string" }
                },
                required: [ "question", "intention", "answer" ]
            }
        },
        skillGaps: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    skill: { type: "string" },
                    severity: { type: "string", enum: [ "low", "medium", "high" ] }
                },
                required: [ "skill", "severity" ]
            }
        },
        preparationPlan: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    day: { type: "number" },
                    focus: { type: "string" },
                    tasks: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: [ "day", "focus", "tasks" ]
            }
        },
        ats_score: { type: "number" },
        strengths: {
            type: "array",
            items: { type: "string" }
        },
        weaknesses: {
            type: "array",
            items: { type: "string" }
        },
        missing_skills: {
            type: "array",
            items: { type: "string" }
        }
    },
    required: [ "title", "matchScore", "technicalQuestions", "behavioralQuestions", "skillGaps", "preparationPlan", "ats_score", "strengths", "weaknesses", "missing_skills" ]
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
    ats_score: z.number().describe("A numeric ATS match score between 0 and 100"),
    strengths: z.array(z.string()).describe("Key professional strengths identified from the resume and job description"),
    weaknesses: z.array(z.string()).describe("Key areas for improvement identified from the resume and job description"),
    missing_skills: z.array(z.string()).describe("Technical keywords from the job description that are absent from the resume")
})

function getFallbackTitle(jobDescription) {
    const firstLine = jobDescription
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(Boolean)

    return firstLine ? firstLine.slice(0, 80) : "Custom Interview Plan"
}

function normalizeScore(score) {
    if (typeof score !== "number") {
        return 65
    }

    const percentageScore = score <= 1 ? score * 100 : score
    return Math.max(0, Math.min(100, Math.round(percentageScore)))
}

function normalizeSeverity(severity) {
    return [ "low", "medium", "high" ].includes(severity) ? severity : "medium"
}

function hasItems(value) {
    return Array.isArray(value) && value.filter(Boolean).length > 0
}

function normalizeQuestion(item, index, fallbackTopic) {
    if (typeof item === "string") {
        return {
            question: `How would you discuss ${fallbackTopic || `topic ${index + 1}`} in this interview?`,
            intention: "The interviewer wants to understand your practical experience and depth of knowledge.",
            answer: item
        }
    }

    return {
        question: item?.question || `How would you approach ${fallbackTopic || `topic ${index + 1}`}?`,
        intention: item?.intention || "The interviewer wants to verify your practical understanding.",
        answer: item?.answer || "Use a specific project example, explain your decisions, and mention measurable outcomes."
    }
}

function normalizeInterviewReport(rawReport, { jobDescription, selfDescription }) {
    const parsedReport = rawReport && typeof rawReport === "object" ? rawReport : {}
    const matchedSkills = Array.isArray(parsedReport.matched_skills) ? parsedReport.matched_skills : []
    const skillsToVerify = Array.isArray(parsedReport.required_skills_to_verify) ? parsedReport.required_skills_to_verify : []
    const reportSummary = Array.isArray(parsedReport.interview_report) ? parsedReport.interview_report : []

    const normalizedSkillGaps = Array.isArray(parsedReport.skillGaps)
        ? parsedReport.skillGaps.map(gap => ({ skill: gap.skill, severity: normalizeSeverity(gap.severity) }))
        : skillsToVerify.map(skill => ({ skill, severity: "medium" }))

    const normalizedStrengths = hasItems(parsedReport.strengths)
        ? parsedReport.strengths.filter(Boolean).slice(0, 4)
        : (matchedSkills.length > 0
            ? matchedSkills.slice(0, 4).map(skill => `Experienced in ${skill}`)
            : [
                "Strong technical aptitude",
                "Effective problem-solving",
                "Clear communication of project outcomes"
            ])

    const normalizedWeaknesses = hasItems(parsedReport.weaknesses)
        ? parsedReport.weaknesses.filter(Boolean).slice(0, 3)
        : (normalizedSkillGaps.length > 0
            ? normalizedSkillGaps.slice(0, 3).map(gap => `Needs stronger ${gap.skill} experience`)
            : [
                "Need stronger examples of impact in project delivery",
                "Need clearer evidence of cross-functional collaboration"
            ])

    const normalizedMissingSkills = hasItems(parsedReport.missing_skills)
        ? parsedReport.missing_skills.filter(Boolean).slice(0, 8)
        : (skillsToVerify.filter(skill => !matchedSkills.includes(skill)).slice(0, 8))

    const fallbackMissingSkills = normalizedSkillGaps.map(gap => gap.skill).filter(Boolean).slice(0, 8)

    const normalized = {
        title: parsedReport.title || getFallbackTitle(jobDescription),
        matchScore: normalizeScore(parsedReport.matchScore ?? parsedReport.overall_fit_score),
        ats_score: normalizeScore(parsedReport.ats_score ?? parsedReport.matchScore ?? parsedReport.overall_fit_score),
        technicalQuestions: Array.isArray(parsedReport.technicalQuestions)
            ? parsedReport.technicalQuestions.map((item, index) => normalizeQuestion(item, index, matchedSkills[ index ]))
            : skillsToVerify.concat(matchedSkills).slice(0, 5).map((skill, index) => ({
                question: `How have you used ${skill} in a real project?`,
                intention: `The interviewer wants to verify your hands-on ${skill} experience.`,
                answer: "Describe the project context, your specific responsibility, the technical choices you made, and the result."
            })),
        behavioralQuestions: Array.isArray(parsedReport.behavioralQuestions)
            ? parsedReport.behavioralQuestions.map((item, index) => normalizeQuestion(item, index, "behavioral experience"))
            : reportSummary.slice(0, 3).map((summary, index) => ({
                question: index === 0 ? "Tell me about your background and why you fit this role." : "Describe a situation that proves this strength.",
                intention: "The interviewer wants to connect your experience to the job requirements.",
                answer: summary
            })),
        skillGaps: normalizedSkillGaps,
        strengths: normalizedStrengths,
        weaknesses: normalizedWeaknesses,
        missing_skills: normalizedMissingSkills.length > 0 ? normalizedMissingSkills : fallbackMissingSkills,
        preparationPlan: Array.isArray(parsedReport.preparationPlan)
            ? parsedReport.preparationPlan.map(day => ({
                day: day.day,
                focus: day.focus,
                tasks: Array.isArray(day.tasks) ? day.tasks : []
            }))
            : skillsToVerify.concat(matchedSkills).slice(0, 5).map((skill, index) => ({
                day: index + 1,
                focus: `Practice ${skill}`,
                tasks: [
                    `Review core ${skill} concepts from the job description.`,
                    `Prepare one project story that demonstrates ${skill}.`,
                    `Practice explaining tradeoffs and debugging decisions related to ${skill}.`
                ]
            }))
    }

    if (normalized.technicalQuestions.length === 0) {
        normalized.technicalQuestions = [
            {
                question: "Walk me through the most relevant project from your resume for this role.",
                intention: "The interviewer wants to assess role fit and technical ownership.",
                answer: "Explain the problem, your responsibilities, the stack used, challenges faced, and the measurable outcome."
            }
        ]
    }

    if (normalized.behavioralQuestions.length === 0) {
        normalized.behavioralQuestions = [
            {
                question: "Tell me about yourself and why this role is a good fit.",
                intention: "The interviewer wants a concise story connecting your background to the job.",
                answer: selfDescription || "Summarize your experience, strongest skills, and why the role matches your goals."
            }
        ]
    }

    if (normalized.preparationPlan.length === 0) {
        normalized.preparationPlan = [
            {
                day: 1,
                focus: "Role alignment",
                tasks: [ "Review the job description.", "Prepare your strongest matching project examples.", "Practice a concise introduction." ]
            }
        ]
    }

    return interviewReportSchema.parse(normalized)
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Act as a Dynamic Recruitment Analyst and expert Applicant Tracking System.

You must analyze the UNIQUE TEXT of the uploaded Resume and compare it against the SPECIFIC Job Description provided below.

CRITICAL DATA INTEGRITY RULES:
- Return ONLY a valid JSON object. No markdown, no explanation, no conversational text.
- Do not use placeholder text.
- Do not copy previous examples.
- Every analysis must be unique to this candidate, this resume, and this job description.
- Preserve the existing output structures for technicalQuestions, behavioralQuestions, skillGaps, and preparationPlan.
- technicalQuestions and behavioralQuestions must contain objects with question, intention, answer.
- skillGaps must contain objects with skill and severity where severity is low, medium, or high.
- preparationPlan must contain objects with day, focus, and tasks.

REQUIRED JSON KEYS:
title, matchScore, ats_score, strengths, weaknesses, missing_skills, technicalQuestions, behavioralQuestions, skillGaps, preparationPlan.

FIELD REQUIREMENTS:
- matchScore: numeric 0-100 interview-role fit score.
- ats_score: numeric 0-100 ATS percentage match based on keyword density, role relevance, required tools, required domain knowledge, and resume evidence.
- strengths: array of 3-4 specific technical or soft skills FOUND IN THE RESUME that match the JD. Mention concrete skills, tools, domains, projects, or responsibilities from the resume.
- weaknesses: array of 2-3 specific gaps where the resume fails to meet JD requirements. Use recruitment terminology such as Enterprise Experience, Architecture, Leadership, Analytics, Domain Knowledge, or Delivery Ownership only when relevant.
- missing_skills: array of specific tools, technologies, frameworks, methods, or domain keywords mentioned in the JD that are nowhere in the resume.
- skillGaps: role-impact gaps with severity; do not duplicate missing_skills blindly unless the skill is a true gap.

Resume:
${resume}

Self Description:
${selfDescription || ""}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: interviewReportResponseSchema,
        }
    })

    return normalizeInterviewReport(JSON.parse(response.text), { jobDescription, selfDescription })


}

async function generateAtsAnalysisFields({ resume, selfDescription, jobDescription, matchScore, skillGaps }) {
    const analysisSchema = {
        type: "object",
        properties: {
            ats_score: { type: "number" },
            strengths: {
                type: "array",
                items: { type: "string" }
            },
            weaknesses: {
                type: "array",
                items: { type: "string" }
            },
            missing_skills: {
                type: "array",
                items: { type: "string" }
            }
        },
        required: [ "ats_score", "strengths", "weaknesses", "missing_skills" ]
    }

    const prompt = `Act as a Dynamic Recruitment Analyst and expert Applicant Tracking System. Analyze the unique uploaded resume text against the specific job description.

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON.
- Do not generate or modify interview questions.
- Do not generate or modify skill gaps.
- Do not use placeholder text.
- Do not copy previous examples.
- Every item must be unique to this candidate, this resume, and this job description.
- ats_score must be a numeric value from 0 to 100 based on keyword density, role relevance, required tools, required domain knowledge, and resume evidence.
- strengths must contain 3-4 specific technical or soft skills FOUND IN THE RESUME that match the job description.
- weaknesses must contain 2-3 specific gaps where the resume fails to meet job description requirements.
- missing_skills must list specific tools, technologies, frameworks, methods, or domain keywords mentioned in the job description that are nowhere in the resume.
- Use professional recruitment-engine tone and terminology such as Enterprise Experience, Architecture, Leadership, Analytics, Domain Knowledge, and Delivery Ownership only when relevant.

Current Match Score: ${matchScore}
Existing Skill Gaps: ${JSON.stringify(skillGaps || [])}
Resume:
${resume}

Self Description:
${selfDescription || ""}

Job Description:
${jobDescription}
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        }
    })

    const parsed = JSON.parse(response.text)

    const fallbackGaps = Array.isArray(skillGaps)
        ? skillGaps.map(gap => gap.skill).filter(Boolean).slice(0, 8)
        : []

    return {
        ats_score: normalizeScore(parsed.ats_score ?? matchScore),
        strengths: hasItems(parsed.strengths)
            ? parsed.strengths.filter(Boolean).slice(0, 4)
            : [
                "Relevant experience aligned with the target role requirements",
                "Demonstrated technical foundation suitable for interview progression",
                "Clear potential to close identified gaps with focused preparation"
            ],
        weaknesses: hasItems(parsed.weaknesses)
            ? parsed.weaknesses.filter(Boolean).slice(0, 3)
            : fallbackGaps.slice(0, 3).map(skill => `Needs stronger ${skill} evidence`),
        missing_skills: hasItems(parsed.missing_skills)
            ? parsed.missing_skills.filter(Boolean).slice(0, 8)
            : fallbackGaps
    }
}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateAtsAnalysisFields, generateResumePdf }
