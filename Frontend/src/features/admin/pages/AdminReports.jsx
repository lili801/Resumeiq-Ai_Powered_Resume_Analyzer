import { useEffect, useState } from "react"
import { deleteAdminReport, getAdminReports } from "../services/admin.api"

const AdminReports = () => {
    const [ reports, setReports ] = useState([])
    const [ pagination, setPagination ] = useState({ page: 1, totalPages: 1 })
    const [ search, setSearch ] = useState("")
    const [ loading, setLoading ] = useState(true)

    const loadReports = (page = 1) => {
        setLoading(true)
        getAdminReports({ page, search })
            .then(data => {
                setReports(data.reports)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        getAdminReports({ page: 1 })
            .then(data => {
                setReports(data.reports)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }, [])

    const handleDelete = async (reportId) => {
        await deleteAdminReport(reportId)
        loadReports(pagination.page)
    }

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>Report Management</span>
                <h1>Interview Reports</h1>
            </header>

            <div className="admin-toolbar">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search reports" />
                <button type="button" onClick={() => loadReports(1)}>Search</button>
            </div>

            <section className="admin-panel">
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Report</th>
                                <th>User</th>
                                <th>ATS</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Loading reports...</td></tr>
                            ) : reports.map(report => (
                                <tr key={report._id}>
                                    <td><strong>{report.title || "Untitled report"}</strong><span>{(report.missing_skills || []).slice(0, 3).join(", ") || "No missing skills"}</span></td>
                                    <td>{report.user?.email || "Unknown"}</td>
                                    <td>{report.ats_score || report.matchScore || 0}%</td>
                                    <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td><button type="button" className="admin-danger" onClick={() => handleDelete(report._id)}>Delete</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => loadReports(pagination.page - 1)}>Prev</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadReports(pagination.page + 1)}>Next</button>
                </div>
            </section>
        </section>
    )
}

export default AdminReports
