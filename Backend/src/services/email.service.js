const nodemailer = require("nodemailer")

function getTransporter() {
    ensureEmailConfigured()

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: String(process.env.EMAIL_SECURE).toLowerCase() === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    })
}

function ensureEmailConfigured() {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env

    if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
        throw new Error("Email service is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER and EMAIL_PASS.")
    }
}

async function sendOtpEmail({ to, username, otp }) {
    const transporter = getTransporter()
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject: "ResumeIQ Email Verification",
            text: `Hello ${username},\n\nYour ResumeIQ email verification OTP is ${otp}.\n\nThis OTP expires in 5 minutes. If you did not request this, please ignore this email.\n\nRegards,\nResumeIQ Team`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #111827;">
                    <h2 style="margin-bottom: 12px;">ResumeIQ Email Verification</h2>
                    <p>Hello ${username},</p>
                    <p>Use the OTP below to verify your email address and complete your ResumeIQ registration.</p>
                    <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 16px 20px; background: #f3f4f6; border-radius: 8px; text-align: center; margin: 22px 0;">
                        ${otp}
                    </div>
                    <p>This OTP expires in <strong>5 minutes</strong>.</p>
                    <p style="color: #6b7280;">If you did not request this verification, you can safely ignore this email.</p>
                    <p>Regards,<br/>ResumeIQ Team</p>
                </div>
            `
        })

        console.log(`OTP email accepted by SMTP for ${to}: ${info.messageId}`)
        return info
    } catch (error) {
        console.error(`OTP email failed for ${to}:`, error.message || error)
        throw error
    }
}

module.exports = { sendOtpEmail, ensureEmailConfigured }
