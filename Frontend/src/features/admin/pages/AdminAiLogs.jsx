import { useEffect, useState } from "react"
import { getAdminAiLogs } from "../services/admin.api"

const AdminAiLogs = () => {
    const [ logs, setLogs ] = useState([])
    const [ pagination, setPagination ] = useState({ page: 1, totalPages: 1 })
    const [ status, setStatus ] = useState("")
    const [ loading, setLoading ] = useState(true)

    const loadLogs = (page = 1) => {
        setLoading(true)
        getAdminAiLogs({ page, status })
            .then(data => {
                setLogs(data.logs)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        getAdminAiLogs({ page: 1 })
            .then(data => {
                setLogs(data.logs)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>AI Monitoring</span>
                <h1>Gemini Logs</h1>
            </header>

            <div className="admin-toolbar">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All statuses</option>
                    <option value="started">Started</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                </select>
                <button type="button" onClick={() => loadLogs(1)}>Filter</button>
            </div>

            <section className="admin-panel">
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Action</th>
                                <th>User</th>
                                <th>Message</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Loading logs...</td></tr>
                            ) : logs.map(log => (
                                <tr key={log._id}>
                                    <td><span className={`admin-status admin-status--${log.status}`}>{log.status}</span></td>
                                    <td>{log.action}</td>
                                    <td>{log.user?.email || "Unknown"}</td>
                                    <td>{log.error || log.message || "No details"}</td>
                                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => loadLogs(pagination.page - 1)}>Prev</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadLogs(pagination.page + 1)}>Next</button>
                </div>
            </section>
        </section>
    )
}

export default AdminAiLogs
