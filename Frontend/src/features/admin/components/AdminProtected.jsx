import { Navigate, useLocation } from "react-router"
import { useAuth } from "../../auth/hooks/useAuth"

const AdminProtected = ({ children }) => {
    const { loading, user } = useAuth()
    const location = useLocation()

    if (loading) {
        return (<main><h1>Loading...</h1></main>)
    }

    if (!user) {
        const redirect = `${location.pathname}${location.search}${location.hash}`
        return <Navigate to={`/?auth=login&redirect=${encodeURIComponent(redirect)}`} replace />
    }

    if (user.role !== "admin") {
        return <Navigate to="/analyze" replace />
    }

    return children
}

export default AdminProtected
