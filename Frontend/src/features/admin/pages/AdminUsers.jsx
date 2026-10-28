import { useEffect, useState } from "react"
import { deleteAdminUser, getAdminUsers, updateAdminUserBlock } from "../services/admin.api"

const AdminUsers = () => {
    const [ users, setUsers ] = useState([])
    const [ pagination, setPagination ] = useState({ page: 1, totalPages: 1 })
    const [ search, setSearch ] = useState("")
    const [ loading, setLoading ] = useState(true)

    const loadUsers = (page = 1) => {
        setLoading(true)
        getAdminUsers({ page, search })
            .then(data => {
                setUsers(data.users)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        getAdminUsers({ page: 1 })
            .then(data => {
                setUsers(data.users)
                setPagination(data.pagination)
            })
            .finally(() => setLoading(false))
    }, [])

    const handleBlockToggle = async (user) => {
        await updateAdminUserBlock({ userId: user._id, isBlocked: !user.isBlocked })
        loadUsers(pagination.page)
    }

    const handleDelete = async (userId) => {
        await deleteAdminUser(userId)
        loadUsers(pagination.page)
    }

    return (
        <section className="admin-stack">
            <header className="admin-header">
                <span>User Management</span>
                <h1>Users</h1>
            </header>

            <div className="admin-toolbar">
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" />
                <button type="button" onClick={() => loadUsers(1)}>Search</button>
            </div>

            <section className="admin-panel">
                <div className="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5">Loading users...</td></tr>
                            ) : users.map(user => (
                                <tr key={user._id}>
                                    <td><strong>{user.username}</strong><span>{user.email}</span></td>
                                    <td>{user.role}</td>
                                    <td>{user.isBlocked ? "Blocked" : "Active"}</td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button type="button" onClick={() => handleBlockToggle(user)}>{user.isBlocked ? "Unblock" : "Block"}</button>
                                        <button type="button" className="admin-danger" onClick={() => handleDelete(user._id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="admin-pagination">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => loadUsers(pagination.page - 1)}>Prev</button>
                    <span>Page {pagination.page} of {pagination.totalPages}</span>
                    <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => loadUsers(pagination.page + 1)}>Next</button>
                </div>
            </section>
        </section>
    )
}

export default AdminUsers
