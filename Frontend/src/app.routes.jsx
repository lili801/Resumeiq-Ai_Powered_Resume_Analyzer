import { createBrowserRouter, Navigate } from "react-router";
import Protected from "./features/auth/components/Protected";
import AdminLayout from "./features/admin/components/AdminLayout";
import AdminProtected from "./features/admin/components/AdminProtected";
import AdminAiLogs from "./features/admin/pages/AdminAiLogs";
import AdminAnalytics from "./features/admin/pages/AdminAnalytics";
import AdminDashboard from "./features/admin/pages/AdminDashboard";
import AdminReports from "./features/admin/pages/AdminReports";
import AdminResumeUploads from "./features/admin/pages/AdminResumeUploads";
import AdminUsers from "./features/admin/pages/AdminUsers";
import Home from "./features/interview/pages/Home";
import History from "./features/interview/pages/History";
import Interview from "./features/interview/pages/Interview";
import Landing from "./features/landing/pages/Landing";


export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Navigate to="/?auth=login" replace />
    },
    {
        path: "/register",
        element: <Navigate to="/?auth=register" replace />
    },
    {
        path: "/",
        element: <Landing />
    },
    {
        path: "/analyze",
        element: <Protected><Home /></Protected>
    },
    {
        path: "/history",
        element: <Protected><History /></Protected>
    },
    {
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },
    {
        path: "/admin",
        element: <AdminProtected><AdminLayout /></AdminProtected>,
        children: [
           {
    index: true,
    element: <Navigate to="dashboard" replace />
},
{
    path: "dashboard",
    element: <AdminDashboard />
},
            {
                path: "users",
                element: <AdminUsers />
            },
            {
                path: "reports",
                element: <AdminReports />
            },
            {
                path: "ai-logs",
                element: <AdminAiLogs />
            },
            {
                path: "analytics",
                element: <AdminAnalytics />
            },
            {
                path: "resume-uploads",
                element: <AdminResumeUploads />
            }
        ]
    }
])
