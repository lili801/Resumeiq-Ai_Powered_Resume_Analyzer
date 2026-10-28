import { useEffect, useState } from "react"
import { getAdminResumeUploads } from "../services/admin.api"

const AdminResumeUploads = () => {
    const [ uploads, setUploads ] = useState([])
    const [ pagination, setPagination ] = useState({ page: 1, totalPages: 1 })
    const [ loading, setLoading ] = useState(true)

    const loadUploads = (page = 1) => {
        setLoading(true)
        getAdminResumeUploads({ page })
            .then(data => {
                setUploads(data.uploads)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        getAdminResumeUploads({ page: 1 })
            .then(data => {
                setUploads(data.uploads)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>Resume Monitoring</span>
                <h1>Resume Uploads</h1>
            </header>

            <section className="admin-panel">
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Report</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Generated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4">Loading uploads...</td></tr>
                            ) : uploads.map(upload => (
                                <tr key={upload._id}>
                                    <td><strong>{upload.title || "Untitled report"}</strong></td>
                                    <td>{upload.user?.email || "Unknown"}</td>
                                    <td>{upload.ats_score || upload.matchScore || 0}%</td>
                                    <td>{new Date(upload.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => loadUploads(pagination.page - 1)}>Prev</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadUploads(pagination.page + 1)}>Next</button>
                </div>
            </section>
        </section>
    )
}

export default AdminResumeUploads
