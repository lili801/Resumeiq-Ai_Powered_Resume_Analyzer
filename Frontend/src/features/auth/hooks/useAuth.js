import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe, verifyOtp, resendOtp } from "../services/auth.api";



export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const getAuthErrorMessage = (err, fallback) => {
        if (err.response?.data?.message) {
            return err.response.data.message
        }

        if (err.response?.status === 404) {
            return "Authentication service is not updated. Please restart the backend server."
        }

        return err.message || fallback
    }


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return { success: true, user: data.user }
        } catch (err) {
            const message = getAuthErrorMessage(err, "Login failed")
            console.error(message)
            return { success: false, message }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            const data = await register({ username, email, password })
            return { success: true, email: data.email, message: data.message }
        } catch (err) {
            const message = getAuthErrorMessage(err, "Registration failed")
            console.error(message)
            return { success: false, message }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async ({ email, otp }) => {
        setLoading(true)
        try {
            const data = await verifyOtp({ email, otp })
            setUser(data.user)
            return { success: true, user: data.user, message: data.message }
        } catch (err) {
            const message = getAuthErrorMessage(err, "OTP verification failed")
            console.error(message)
            return { success: false, message }
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async ({ email }) => {
        setLoading(true)
        try {
            const data = await resendOtp({ email })
            return { success: true, email: data.email, message: data.message }
        } catch (err) {
            const message = getAuthErrorMessage(err, "Failed to resend OTP")
            console.error(message)
            return { success: false, message }
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getAndSetUser = async () => {
            try {
            const data = await getMe()
            if (data?.user) {
                setUser(data.user)
            } else {
                setUser(null)
            }
        } catch (err) {
            console.error("Error fetching user:", err)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()

    }, [setLoading, setUser])

    return { user, loading, handleRegister, handleVerifyOtp, handleResendOtp, handleLogin, handleLogout }
}
