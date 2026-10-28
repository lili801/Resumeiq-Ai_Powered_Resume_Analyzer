import { api } from "../../auth/services/auth.api"

export const getAdminDashboard = async () => {
    const response = await api.get("/api/admin/dashboard")
    return response.data
}

export const getAdminUsers = async ({ page = 1, limit = 10, search = "" } = {}) => {
    const response = await api.get("/api/admin/users", {
        params: { page, limit, search }
    })
    return response.data
}

export const updateAdminUserBlock = async ({ userId, isBlocked }) => {
    const response = await api.patch(`/api/admin/users/${userId}/block`, { isBlocked })
    return response.data
}

export const deleteAdminUser = async (userId) => {
    const response = await api.delete(`/api/admin/users/${userId}`)
    return response.data
}

export const getAdminReports = async ({ page = 1, limit = 10, search = "" } = {}) => {
    const response = await api.get("/api/admin/reports", {
        params: { page, limit, search }
    })
    return response.data
}

export const deleteAdminReport = async (reportId) => {
    const response = await api.delete(`/api/admin/reports/${reportId}`)
    return response.data
}

export const getAdminAiLogs = async ({ page = 1, limit = 10, status = "" } = {}) => {
    const response = await api.get("/api/admin/ai-logs", {
        params: { page, limit, status }
    })
    return response.data
}

export const getAdminResumeUploads = async ({ page = 1, limit = 10 } = {}) => {
    const response = await api.get("/api/admin/resume-uploads", {
        params: { page, limit }
    })
    return response.data
}

export const getAdminAnalytics = async () => {
    const response = await api.get("/api/admin/analytics")
    return response.data
}
