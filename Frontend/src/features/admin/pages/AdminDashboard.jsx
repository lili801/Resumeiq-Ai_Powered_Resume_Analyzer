import { useEffect, useState } from "react"
import { getAdminDashboard } from "../services/admin.api"

const AdminDashboard = () => {
    const [ dashboard, setDashboard ] = useState(null)
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        getAdminDashboard()
            .then(data => setDashboard(data.dashboard))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <section className="admin-panel"><h1>Loading dashboard...</h1></section>
    }

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>Control Center</span>
                <h1>Admin Dashboard</h1>
            </header>

            <div className="admin-metrics">
                <article><span>Total Users</span><strong>{dashboard?.totalUsers || 0}</strong></article>
                <article><span>Total Reports</span><strong>{dashboard?.totalReports || 0}</strong></article>
                <article><span>Average ATS</span><strong>{dashboard?.averageAtsScore || 0}%</strong></article>
                <article><span>AI Failures</span><strong>{dashboard?.aiLogs?.failed || 0}</strong></article>
            </div>

            <div className="admin-grid">
                <section className="admin-panel">
                    <h2>Recent Reports</h2>
                    <div className="admin-list">
                        {(dashboard?.recentReports || []).map(report => (
                            <div key={report._id} className="admin-list__item">
                                <strong>{report.title || "Untitled report"}</strong>
                                <span>{report.user?.email || "Unknown user"} · {report.ats_score || report.matchScore || 0}%</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="admin-panel">
                    <h2>Recent Users</h2>
                    <div className="admin-list">
                        {(dashboard?.recentUsers || []).map(user => (
                            <div key={user._id} className="admin-list__item">
                                <strong>{user.username}</strong>
                                <span>{user.email} · {user.isBlocked ? "Blocked" : user.role}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </section>
    )
}

export default AdminDashboard
