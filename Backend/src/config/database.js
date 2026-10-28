const mongoose = require("mongoose")

mongoose.set("bufferCommands", false)

async function connectToDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not defined in Backend/.env")
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 60000,
            connectTimeoutMS: 60000,
            retryWrites: true
        })

        console.log("Connected to Database")
    }
    catch (err) {
        console.error("Database connection error:", err.message || err)
        throw err
    }
}

module.exports = connectToDB
