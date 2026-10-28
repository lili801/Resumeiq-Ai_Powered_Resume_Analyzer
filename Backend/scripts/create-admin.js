require("dotenv").config()

const bcrypt = require("bcryptjs")
const mongoose = require("mongoose")
const User = require("../src/models/user.model")

function getArg(name) {
    const prefix = `--${name}=`
    const arg = process.argv.find(item => item.startsWith(prefix))
    return arg ? arg.slice(prefix.length) : undefined
}

async function main() {
    const username = (getArg("username") || process.env.ADMIN_USERNAME || "admin").trim()
    const email = (getArg("email") || process.env.ADMIN_EMAIL || "").trim().toLowerCase()
    const password = getArg("password") || process.env.ADMIN_PASSWORD

    if (!email || !password) {
        throw new Error("Usage: node scripts/create-admin.js --username=admin --email=admin@example.com --password=YourPassword123")
    }

    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in Backend/.env")
    }

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 60000 })

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        existingUser.username = username || existingUser.username
        existingUser.password = await bcrypt.hash(password, 10)
        existingUser.role = "admin"
        existingUser.isBlocked = false
        await existingUser.save()

        console.log(JSON.stringify({
            message: "Existing user promoted to admin.",
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                role: existingUser.role,
                isBlocked: existingUser.isBlocked
            }
        }, null, 2))
        return
    }

    const user = await User.create({
        username,
        email,
        password: await bcrypt.hash(password, 10),
        role: "admin",
        isBlocked: false
    })

    console.log(JSON.stringify({
        message: "Admin user created.",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            isBlocked: user.isBlocked
        }
    }, null, 2))
}

main()
    .catch(error => {
        console.error(error.message || error)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
