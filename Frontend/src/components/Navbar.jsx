import React from "react"
import { Link, NavLink, useNavigate } from "react-router"
import { useAuth } from "../features/auth/hooks/useAuth"
import "./navbar.scss"

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate("/login")
    }

    return (
        <header className="global-navbar">
            <Link to="/" className="global-navbar__logo">
                <span className="global-navbar__logo-mark">RA</span>
                <span>Resume Analytics</span>
            </Link>

            <nav className="global-navbar__links">
                <NavLink to="/" className={({ isActive }) => isActive ? "global-navbar__link global-navbar__link--active" : "global-navbar__link"}>
                    Home
                </NavLink>
                <NavLink to="/analyze" className={({ isActive }) => isActive ? "global-navbar__link global-navbar__link--active" : "global-navbar__link"}>
                    Analyze
                </NavLink>
                {user?.role === "admin" && (
                    <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? "global-navbar__link global-navbar__link--active" : "global-navbar__link"}>
                        Admin
                    </NavLink>
                )}
                {user && (
                    <button type="button" className="global-navbar__logout" onClick={onLogout}>
                        Logout
                    </button>
                )}
            </nav>
        </header>
    )
}

export default Navbar
