import { NavLink, Outlet } from "react-router"
import { useAuth } from "../../auth/hooks/useAuth"
import "../styles/admin.scss"

const navItems = [
   { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/reports", label: "Reports" },
    { path: "/admin/ai-logs", label: "AI Logs" },
    { path: "/admin/analytics", label: "Analytics" },
    { path: "/admin/resume-uploads", label: "Resumes" }
]

const AdminLayout = () => {
    const { user, handleLogout } = useAuth()

    return (
        <div className="admin-page">
            <aside className="admin-sidebar">
                <div className="admin-sidebar__brand">
                    <span>ResumeIQ</span>
                    <strong>Admin</strong>
                </div>

                <nav className="admin-sidebar__nav" aria-label="Admin navigation">
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => isActive ? "admin-sidebar__link admin-sidebar__link--active" : "admin-sidebar__link"}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="admin-sidebar__footer">
                    <span>{user?.username || "Admin"}</span>
                    <button type="button" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            <main className="admin-main">
                <Outlet />
            </main>
        </div>
    )
}

export default AdminLayout
