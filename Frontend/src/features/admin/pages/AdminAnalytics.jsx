import { useEffect, useState } from "react"
import { getAdminAnalytics } from "../services/admin.api"

const AdminAnalytics = () => {
    const [ analytics, setAnalytics ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        getAdminAnalytics()
            .then(data => setAnalytics(data.analytics))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <section className="admin-panel"><h1>Loading analytics...</h1></section>
    }

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>Analytics</span>
                <h1>Report Insights</h1>
            </header>

            <div className="admin-grid">
                <section className="admin-panel">
                    <h2>Reports Per Day</h2>
                    <div className="admin-bars">
                        {(analytics?.reportsPerDay || []).map(item => (
                            <div key={item.date} className="admin-bars__row">
                                <span>{item.date}</span>
                                <div><i style={{ width: `${Math.min(item.count * 12, 100)}%` }} /></div>
                                <strong>{item.count}</strong>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="admin-panel">
                    <h2>ATS Score Distribution</h2>
                    <div className="admin-list">
                        {(analytics?.atsScoreDistribution || []).map(item => (
                            <div key={item.range} className="admin-list__item">
                                <strong>{item.range}</strong>
                                <span>{item.count} reports</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <section className="admin-panel">
                <h2>Most Common Missing Skills</h2>
                <div className="admin-tags">
                    {(analytics?.mostCommonMissingSkills || []).map(item => (
                        <span key={item.skill}>{item.skill} · {item.count}</span>
                    ))}
                </div>
            </section>
        </section>
    )
}

export default AdminAnalytics
