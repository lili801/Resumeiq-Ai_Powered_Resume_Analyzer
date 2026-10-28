import React, { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import Navbar from "../../../components/Navbar"
import AuthModal from "../../auth/components/AuthModal"
import { useAuth } from "../../auth/hooks/useAuth"
import "./landing.scss"

const Landing = () => {
    const navigate = useNavigate()
    const [ searchParams, setSearchParams ] = useSearchParams()
    const { user } = useAuth()
    const [ authModalOpen, setAuthModalOpen ] = useState(false)
    const [ authMode, setAuthMode ] = useState("login")
    const [ intendedPath, setIntendedPath ] = useState("/analyze")

    useEffect(() => {
        const authMode = searchParams.get("auth")
        const redirect = searchParams.get("redirect")

        if ((authMode === "login" || authMode === "register") && !user) {
            setAuthMode(authMode)
            setIntendedPath(redirect || "/analyze")
            setAuthModalOpen(true)
        }
    }, [ searchParams, user ])

    const continueTo = (path) => {
        if (user) {
            navigate(path)
            return
        }

        setIntendedPath(path)
        setAuthMode("login")
        setAuthModalOpen(true)
    }

    const handleAuthSuccess = (authenticatedUser) => {
        setAuthModalOpen(false)
        setSearchParams({})
        const hasExplicitRedirect = Boolean(searchParams.get("redirect"))
        const destination = authenticatedUser?.role === "admin" && !hasExplicitRedirect
            ? "/admin/dashboard"
            : intendedPath

        navigate(destination)
    }

    return (
        <div className="landing-page">
            <Navbar />

            <main className={`landing-hero ${authModalOpen ? "landing-hero--blurred" : ""}`}>
                <section className="landing-hero__content">
                    <span className="landing-hero__eyebrow">AI Interview Strategy Builder</span>
                    <h1>Optimize Your Interview Strategy</h1>
                    <p>
                        Turn your resume and target job description into a focused interview plan with match scoring,
                        technical questions, behavioral prompts, skill gaps, and a preparation roadmap.
                    </p>

                    <div className="landing-hero__actions">
                        <button type="button" className="landing-button landing-button--primary" onClick={() => continueTo("/analyze")}>
                            Get Started
                        </button>
                        <button type="button" className="landing-button landing-button--secondary" onClick={() => continueTo("/history")}>
                            View History
                        </button>
                    </div>

                    <div className="landing-hero__meta">
                        <span>PDF resume analysis</span>
                        <span>Gemini powered insights</span>
                        <span>Saved interview plans</span>
                    </div>
                </section>

                <section className="landing-preview" aria-label="Resume analytics preview">
                    <div className="landing-preview__header">
                        <div>
                            <span className="landing-preview__score">92</span>
                            <span className="landing-preview__label">Match Score</span>
                        </div>
                        <span className="landing-preview__badge">Live Strategy</span>
                    </div>

                    <div className="landing-preview__panel">
                        <p>Technical Focus</p>
                        <span />
                        <span />
                        <span />
                    </div>

                    <div className="landing-preview__panel landing-preview__panel--pink">
                        <p>Skill Gaps</p>
                        <div className="landing-preview__tags">
                            <span>System Design</span>
                            <span>API Security</span>
                            <span>Scaling</span>
                        </div>
                    </div>

                    <div className="landing-preview__timeline">
                        <span />
                        <span />
                        <span />
                    </div>
                </section>
            </main>

            <AuthModal
                open={authModalOpen}
                initialMode={authMode}
                onClose={() => {
                    setAuthModalOpen(false)
                    setSearchParams({})
                }}
                onSuccess={handleAuthSuccess}
            />
        </div>
    )
}

export default Landing
