import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading,user } = useAuth()
    const location = useLocation()


    if(loading){
        return (<main><h1>Loading...</h1></main>)
    }

    if(!user){
        const redirect = `${location.pathname}${location.search}${location.hash}`
        return <Navigate to={`/?auth=login&redirect=${encodeURIComponent(redirect)}`} replace />
    }
    
    return children
}

export default Protected
