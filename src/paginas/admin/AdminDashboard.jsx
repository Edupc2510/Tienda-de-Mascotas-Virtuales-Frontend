import React from 'react'
import { useUsuarios } from '../../context/UsuariosContext'
import { useProductos } from '../../context/ProductosContext'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard(){
  const { usuarios, ordenes } = useUsuarios()
  const { productos } = useProductos()
  const navigate = useNavigate()
  const ingresos = (ordenes || []).reduce((s,o)=> s + (parseFloat(o.total)||0), 0).toFixed(2)
  return (
    <section>
      <h1>Panel Administrador</h1>
      <div style={{display:'flex', gap:12}}>
        <div className="card">Usuarios: {usuarios.length}</div>
        <div className="card" onClick={()=> navigate('/admin/ordenes')} style={{cursor:'pointer'}}>Órdenes: {ordenes.length}</div>
        <div className="card">Ingresos totales: S/ {ingresos}</div>
      </div>
    </section>
  )
}
