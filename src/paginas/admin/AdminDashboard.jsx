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
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px',
      minHeight: '80vh',
      backgroundColor: '#fff3ec'
    }}>
      <h1 style={{ marginBottom: '40px', fontSize: '2.5rem', color: '#333' }}>Panel Administrador</h1>

      {/* Grid para los cuadrados */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '30px',
        width: '100%',
        maxWidth: '800px',
        marginBottom: '30px'
      }}>
        {/* Cuadrado Usuarios */}
        <div 
          className="card" 
          onClick={() => navigate('/admin/usuarios')} 
          style={{
            cursor: 'pointer',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontSize: '1.5rem',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Usuarios: {usuarios.length}
          <div style={{ marginTop: '15px' }}>
            <img src="/images/usuarios.png" alt="Usuarios" style={{ width: '200px', height: '200px' }} />
          </div>
        </div>

        {/* Cuadrado Órdenes */}
        <div 
          className="card" 
          onClick={()=> navigate('/admin/ordenes')} 
          style={{
            cursor: 'pointer',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center',
            fontSize: '1.5rem',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          Órdenes: {ordenes.length}
          <div style={{ marginTop: '15px' }}>
            <img src="/images/ordenes.png" alt="Órdenes" style={{ width: '200px', height: '200px' }} />
          </div>
        </div>
      </div>

      {/* Rectángulo Ingresos Totales */}
      <div style={{
        width: '100%',
        maxWidth: '800px',
        padding: '30px',
        backgroundColor: '#fff',
        borderRadius: '15px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        fontSize: '1.8rem',
      }}>
        Ingresos totales: S/ {ingresos}
      </div>
    </section>
  )
}
