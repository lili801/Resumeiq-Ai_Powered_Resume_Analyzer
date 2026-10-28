require("dotenv").config()
const app = require("./app")
const connectToDB = require("./config/database")

async function startServer() {
    try {
        console.log("Attempting to connect to database...")
        await connectToDB()
        console.log("Database connected successfully!")
        
        app.listen(3000, () => {
            console.log("Server is running on port 3000")
        })
    } catch (err) {
        console.error("❌ Failed to start server:", err.message)
        console.error("Full error:", err)
        process.exit(1)
    }
}

startServer()