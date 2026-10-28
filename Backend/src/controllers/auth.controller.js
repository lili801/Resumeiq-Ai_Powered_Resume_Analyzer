const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")
const { sendOtpEmail, ensureEmailConfigured } = require("../services/email.service")

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000))
}

function getOtpExpiry() {
    return new Date(Date.now() + 5 * 60 * 1000)
}

function canResendOtp(user) {
    if (!user.otpLastSentAt) {
        return true
    }

    return Date.now() - user.otpLastSentAt.getTime() >= 60 * 1000
}

function getResendWaitSeconds(user) {
    if (!user.otpLastSentAt) {
        return 0
    }

    const elapsed = Date.now() - user.otpLastSentAt.getTime()
    return Math.max(Math.ceil((60 * 1000 - elapsed) / 1000), 0)
}

function buildUserResponse(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isVerified: user.isVerified
    }
}

function setAuthCookie(res, user) {
    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000
    })
}

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {

    try {
        let { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        username = username.trim()
        email = email.trim().toLowerCase()
        ensureEmailConfigured()

        const existingEmailUser = await userModel.findOne({ email })

        if (existingEmailUser && existingEmailUser.isVerified !== false) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const existingUsernameUser = await userModel.findOne({ username })

        if (existingUsernameUser && String(existingUsernameUser._id) !== String(existingEmailUser?._id)) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)
        const otp = generateOtp()
        const otpExpiry = getOtpExpiry()

        const user = existingEmailUser || new userModel({
            username,
            email,
            password: hash,
            isVerified: false,
            otp,
            otpExpiry,
            otpLastSentAt: new Date()
        })

        if (existingEmailUser) {
            user.username = username
            user.password = hash
            user.isVerified = false
            user.otp = otp
            user.otpExpiry = otpExpiry
            user.otpLastSentAt = new Date()
        }

        await sendOtpEmail({ to: email, username, otp })
        await user.save()

        console.log(`OTP email sent successfully to ${email}`)

        res.status(201).json({
            message: "OTP sent successfully. Please verify your email.",
            email: user.email
        })
    } catch (err) {
        console.error("Register error:", err.message || err)
        res.status(500).json({
            message: "Unable to send verification OTP. Please try again."
        })
    }

}


/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {

    let { email, password } = req.body
    email = email?.trim().toLowerCase()

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    if (user.isBlocked) {
        return res.status(403).json({
            message: "Your account has been blocked."
        })
    }

    if (user.isVerified === false) {
        console.log(`Login blocked for unverified email: ${email}`)
        return res.status(403).json({
            message: "Please verify your email before login"
        })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    setAuthCookie(res, user)
    res.status(200).json({
        message: "User loggedIn successfully.",
        user: buildUserResponse(user)
    })
}

async function verifyOtpController(req, res) {
    let { email, otp } = req.body
    email = email?.trim().toLowerCase()
    otp = otp?.trim()

    if (!email || !otp) {
        console.log("OTP verification failed: missing email or OTP")
        return res.status(400).json({
            message: "Please provide email and OTP"
        })
    }

    if (!/^\d{6}$/.test(otp)) {
        console.log(`OTP verification failed for ${email}: OTP must be 6 digits`)
        return res.status(400).json({
            message: "OTP must be 6 digits"
        })
    }

    const user = await userModel.findOne({ email })

    if (!user) {
        console.log(`OTP verification failed: user not found for ${email}`)
        return res.status(404).json({
            message: "User not found"
        })
    }

    if (user.isVerified) {
        console.log(`OTP verification skipped: ${email} is already verified`)
        return res.status(400).json({
            message: "Email is already verified"
        })
    }

    if (!user.otp || !user.otpExpiry || user.otp !== otp) {
        console.log(`Invalid OTP for ${email}`)
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    if (user.otpExpiry < new Date()) {
        console.log(`Expired OTP for ${email}`)
        return res.status(400).json({
            message: "OTP expired. Please request a new OTP."
        })
    }

    user.isVerified = true
    user.otp = null
    user.otpExpiry = null
    user.otpLastSentAt = null
    await user.save()

    console.log(`Email verified successfully for ${email}`)

    setAuthCookie(res, user)

    res.status(200).json({
        message: "Email verified successfully.",
        user: buildUserResponse(user)
    })
}

async function resendOtpController(req, res) {
    let { email } = req.body
    email = email?.trim().toLowerCase()

    if (!email) {
        return res.status(400).json({
            message: "Please provide email"
        })
    }

    ensureEmailConfigured()

    const user = await userModel.findOne({ email })

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    if (user.isVerified) {
        return res.status(400).json({
            message: "Email is already verified"
        })
    }

    if (!canResendOtp(user)) {
        const waitSeconds = getResendWaitSeconds(user)
        console.log(`Resend OTP blocked for ${email}: wait ${waitSeconds} seconds`)
        return res.status(429).json({
            message: `Please wait ${waitSeconds} seconds before requesting another OTP.`
        })
    }

    const otp = generateOtp()
    user.otp = otp
    user.otpExpiry = getOtpExpiry()
    user.otpLastSentAt = new Date()

    await sendOtpEmail({ to: user.email, username: user.username, otp })
    await user.save()

    console.log(`OTP email resent successfully to ${email}`)

    res.status(200).json({
        message: "A new OTP has been sent to your email.",
        email: user.email
    })
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    const token = req.cookies.token

    if (token) {
        await tokenBlacklistModel.create({ token })
    }

    res.clearCookie("token", { path: "/" })

    res.status(200).json({
        message: "User logged out successfully"
    })
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {

    const user = await userModel.findById(req.user.id)



    res.status(200).json({
        message: "User details fetched successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked,
            isVerified: user.isVerified
        }
    })

}



module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
    verifyOtpController,
    resendOtpController
}
