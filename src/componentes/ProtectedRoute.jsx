import React from 'react'
import { useUsuarios } from '../context/UsuariosContext'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }){
  const { usuarioLogueado } = useUsuarios()
  
  if (!usuarioLogueado) {
    return <Navigate to="/login" replace />
  }

  if (usuarioLogueado.role !== 'admin') {
    return <Navigate to="/not-found" replace />
  }

  return children
}
