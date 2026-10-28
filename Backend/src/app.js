const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const mongoose = require("mongoose")

const app = express()

mongoose.set("bufferCommands", false)

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176"
]

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || origin?.startsWith("http://localhost:")) {
            return callback(null, true)
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    credentials: true
}))

// 🔥 IMPORTANT: load models BEFORE routes
require("./models/user.model")
require("./models/aiLog.model")

function requireDatabaseConnection(req, res, next) {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            message: "Database is not connected. Restart the backend and check the MongoDB connection.",
            readyState: mongoose.connection.readyState
        })
    }

    next()
}

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const adminRouter = require("./routes/admin.routes")

/* using all the routes here */
app.use("/api/auth", requireDatabaseConnection, authRouter)
app.use("/api/interview", requireDatabaseConnection, interviewRouter)
app.use("/api/admin", requireDatabaseConnection, adminRouter)

// Health check endpoint to verify DB connection
app.get("/health", (req, res) => {
    res.status(200).json({
        message: "Server is running",
        database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        databaseReadyState: mongoose.connection.readyState,
        timestamp: new Date().toISOString()
    })
})

// DB test endpoint
app.get("/api/db-test", async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: "Database is not connected",
                readyState: mongoose.connection.readyState
            })
        }

        await mongoose.connection.db.admin().ping()
        res.status(200).json({
            message: "Database connection successful",
            database: "connected"
        })
    } catch (err) {
        console.error("Database connection check failed:", err.message)
        res.status(500).json({
            message: "Database connection failed"
        })
    }
})

app.use((err, req, res, next) => {
    console.error(err)

    res.status(500).json({
        message: "Internal server error"
    })
})

module.exports = app
