import React from "react"
import { useNavigate } from "react-router"
import Navbar from "../../../components/Navbar"
import { useInterview } from "../hooks/useInterview"
import "../style/history.scss"

const History = () => {
    const navigate = useNavigate()
    const { reports, loading } = useInterview()

    return (
        <div className="history-page">
            <Navbar />

            <main className="history-shell">
                <header className="history-header">
                    <span className="history-header__eyebrow">Saved Plans</span>
                    <h1>My Recent Interview Plans</h1>
                    <p>Review previous resume-to-role analysis reports and reopen any generated interview strategy.</p>
                </header>

                {loading ? (
                    <section className="history-empty">
                        <h2>Loading your saved plans...</h2>
                    </section>
                ) : reports.length > 0 ? (
                    <section className="history-grid" aria-label="Recent interview plans">
                        {reports.map(report => (
                            <article key={report._id} className="history-card" onClick={() => navigate(`/interview/${report._id}`)}>
                                <div className="history-card__top">
                                    <h2>{report.title || "Untitled Position"}</h2>
                                    <span className={`history-card__score ${report.matchScore >= 80 ? "history-card__score--high" : report.matchScore >= 60 ? "history-card__score--mid" : "history-card__score--low"}`}>
                                        {report.matchScore}%
                                    </span>
                                </div>
                                <p>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <button type="button">Open Plan</button>
                            </article>
                        ))}
                    </section>
                ) : (
                    <section className="history-empty">
                        <h2>No saved plans yet</h2>
                        <p>Create your first interview strategy from the analyze page.</p>
                        <button type="button" onClick={() => navigate("/analyze")}>Create Plan</button>
                    </section>
                )}
            </main>
        </div>
    )
}

export default History
