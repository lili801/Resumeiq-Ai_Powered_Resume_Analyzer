import { useEffect, useState } from "react"
import { useAuth } from "../hooks/useAuth"
import "./auth-modal.scss"

const AuthModal = ({ open, initialMode = "login", onClose, onSuccess }) => {
    const { loading, handleLogin, handleRegister, handleVerifyOtp, handleResendOtp } = useAuth()
    const [ mode, setMode ] = useState(initialMode)
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ otp, setOtp ] = useState("")
    const [ pendingEmail, setPendingEmail ] = useState("")
    const [ otpMode, setOtpMode ] = useState(false)
    const [ showPassword, setShowPassword ] = useState(false)
    const [ error, setError ] = useState("")
    const [ successMessage, setSuccessMessage ] = useState("")

    useEffect(() => {
        if (open) {
            setMode(initialMode)
            setError("")
            setSuccessMessage("")
            setOtp("")
            setOtpMode(false)
            setPendingEmail("")
            setShowPassword(false)
        }
    }, [ open, initialMode ])

    if (!open) {
        return null
    }

    const isRegister = mode === "register"

    const maskEmail = (value) => {
        const [ name = "", domain = "" ] = value.split("@")
        if (!domain) {
            return value
        }

        const visibleName = name.length <= 2 ? name[ 0 ] || "" : `${name[ 0 ]}${"*".repeat(Math.max(name.length - 2, 1))}${name[ name.length - 1 ]}`
        return `${visibleName}@${domain}`
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError("")
        setSuccessMessage("")

        if (otpMode) {
            const result = await handleVerifyOtp({ email: pendingEmail, otp })

            if (!result.success) {
                setError(result.message)
                return
            }

            setSuccessMessage(result.message)
            onSuccess?.(result.user)
            return
        }

        const result = isRegister
            ? await handleRegister({ username, email, password })
            : await handleLogin({ email, password })

        if (!result.success) {
            setError(result.message)
            return
        }

        if (isRegister) {
            setPendingEmail(result.email || email)
            setOtpMode(true)
            setOtp("")
            setSuccessMessage(result.message || "OTP sent successfully.")
            return
        }

        onSuccess?.(result.user)
    }

    const switchMode = () => {
        setMode(isRegister ? "login" : "register")
        setError("")
        setSuccessMessage("")
        setOtp("")
        setOtpMode(false)
        setPendingEmail("")
    }

    const handleResend = async () => {
        setError("")
        setSuccessMessage("")

        const result = await handleResendOtp({ email: pendingEmail })

        if (!result.success) {
            setError(result.message)
            return
        }

        setSuccessMessage(result.message)
    }

    const handleBackToRegister = () => {
        setOtpMode(false)
        setOtp("")
        setError("")
        setSuccessMessage("")
    }

    return (
        <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
            <button type="button" className="auth-modal__backdrop" aria-label="Close authentication modal" onClick={onClose} />

            <section className="auth-modal__panel">
                <button type="button" className="auth-modal__close" aria-label="Close" onClick={onClose}>
                    &times;
                </button>

                <div className="auth-modal__brand">
                    <span className="auth-modal__logo">RA</span>
                    <span>Resume Analytics</span>
                </div>

                <h2 id="auth-modal-title">{otpMode ? "Verify Email" : isRegister ? "Create Account" : "Login"}</h2>
                <p className="auth-modal__subtitle">
                    {otpMode
                        ? `Enter the 6-digit OTP sent to ${maskEmail(pendingEmail)}.`
                        : isRegister
                        ? "Create an account to generate and save interview plans."
                        : "Login to continue to your interview strategy workspace."}
                </p>

                <form className="auth-modal__form" onSubmit={handleSubmit}>
                    {otpMode ? (
                        <label className="auth-modal__field">
                            <span>OTP</span>
                            <input
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                type="text"
                                name="otp"
                                placeholder="Enter 6-digit OTP"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                            />
                        </label>
                    ) : isRegister && (
                        <label className="auth-modal__field">
                            <span>Username</span>
                            <input
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                type="text"
                                name="username"
                                placeholder="Enter username"
                                required
                            />
                        </label>
                    )}

                    {!otpMode && (
                        <label className="auth-modal__field">
                            <span>Email</span>
                            <input
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                type="email"
                                name="email"
                                placeholder="Enter email address"
                                required
                            />
                        </label>
                    )}

                    {!otpMode && (
                        <label className="auth-modal__field">
                            <span>Password</span>
                            <div className="auth-modal__password-wrap">
                                <input
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-modal__password-toggle"
                                    onClick={() => setShowPassword(current => !current)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M2.8 3.9 4.1 2.6l17.3 17.3-1.3 1.3-3-3A11.2 11.2 0 0 1 12 19.5C5.9 19.5 2 12 2 12a17 17 0 0 1 4.1-5.1L2.8 3.9Zm5 4.9A9.9 9.9 0 0 0 4.3 12s3.2 5.5 7.7 5.5c1.3 0 2.5-.4 3.6-1L14 14.9a3.5 3.5 0 0 1-4.9-4.9L7.8 8.8Zm3 3a1.5 1.5 0 0 0 1.9 1.9l-1.9-1.9Zm1.2-7.3c6.1 0 10 7.5 10 7.5a16.7 16.7 0 0 1-2.7 3.7L17.9 14a9.9 9.9 0 0 0 1.8-2S16.5 6.5 12 6.5c-.7 0-1.4.1-2 .3L8.5 5.3c1.1-.5 2.3-.8 3.5-.8Zm3.5 7.1a3.5 3.5 0 0 0-3.1-3.1l3.1 3.1Z" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M12 4.5C5.9 4.5 2 12 2 12s3.9 7.5 10 7.5S22 12 22 12 18.1 4.5 12 4.5Zm0 13C7.5 17.5 4.3 12 4.3 12S7.5 6.5 12 6.5 19.7 12 19.7 12 16.5 17.5 12 17.5Zm0-9a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0 5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </label>
                    )}

                    {error && <p className="auth-modal__error">{error}</p>}
                    {successMessage && <p className="auth-modal__success">{successMessage}</p>}

                    <button type="submit" className="auth-modal__submit" disabled={loading}>
                        {loading ? "Please wait..." : otpMode ? "Verify OTP" : isRegister ? "Register" : "Login"}
                    </button>

                    {otpMode && (
                        <div className="auth-modal__otp-actions">
                            <button type="button" onClick={handleResend} disabled={loading}>Resend OTP</button>
                            <button type="button" onClick={handleBackToRegister} disabled={loading}>Back</button>
                        </div>
                    )}
                </form>

                {!otpMode && (
                    <p className="auth-modal__swap">
                        {isRegister ? "Already have an account?" : "Don't have an account?"}
                        <button type="button" onClick={switchMode}>
                            {isRegister ? "Login" : "Register"}
                        </button>
                    </p>
                )}
            </section>
        </div>
    )
}

export default AuthModal
