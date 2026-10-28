import axios from "axios"


export const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

export async function register({ username, email, password }) {

    try {
        const response = await api.post('/api/auth/register', {
            username, email, password
        })

        return response.data

    } catch (err) {
        console.error("Register error:", err)
        throw err
    }

}

export async function verifyOtp({ email, otp }) {
    try {
        const response = await api.post("/api/auth/verify-otp", {
            email, otp
        })

        return response.data
    } catch (err) {
        console.error("OTP verification error:", err)
        throw err
    }
}

export async function resendOtp({ email }) {
    try {
        const response = await api.post("/api/auth/resend-otp", {
            email
        })

        return response.data
    } catch (err) {
        console.error("Resend OTP error:", err)
        throw err
    }
}

export async function login({ email, password }) {

    try {

        const response = await api.post("/api/auth/login", {
            email, password
        })

        return response.data

    } catch (err) {
        console.error("Login error:", err)
        throw err
    }

}

export async function logout() {
    try {

        const response = await api.get("/api/auth/logout")

        return response.data

    } catch (err) {
console.log(err)
    }
}

export async function getMe() {

    try {

        const response = await api.get("/api/auth/get-me")

        return response.data

    } catch (err) {
        if (err.response?.status === 401) {
            return { user: null }
        } else {
            console.error("Error fetching user:", err)
            throw err
        }
    }

}
