import React, { useMemo, useState } from 'react'
import { useUsuarios } from '../../context/UsuariosContext'
import { useNavigate } from 'react-router-dom'

export default function AdminOrdenes(){
  const { ordenes = [], cancelOrder } = useUsuarios()
  const navigate = useNavigate()

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('todos')
  const [pagina, setPagina] = useState(1)
  const ITEMS_POR_PAGINA = 8

  const filtered = useMemo(()=>{
    return (ordenes || []).filter(o=>{
      if (status !== 'todos' && o.estado !== status) return false
      if (!q) return true
      const qq = q.toLowerCase()
      return String(o.id).includes(q) || (o.envio?.nombre||'').toLowerCase().includes(qq) || String(o.usuarioId).includes(q) || (o.envio?.direccion||'').toLowerCase().includes(qq)
    })
  },[ordenes,q,status])

  const totalPaginas = Math.max(1, Math.ceil(filtered.length / ITEMS_POR_PAGINA))
  const start = (pagina - 1) * ITEMS_POR_PAGINA
  const pageItems = filtered.slice(start, start + ITEMS_POR_PAGINA)

  const goToPage = (p) => { setPagina(Math.max(1, Math.min(totalPaginas, p))) }

  const handleCancel = (o) => {
    if (o.estado !== 'Pendiente') { alert('Solo se pueden cancelar órdenes pendientes') ; return }
    if (window.confirm(`¿Cancelar orden #${o.id}?`)){
      cancelOrder(o.id)
      alert('Orden cancelada')
    }
  }

  return (
    <section>
      <div style={{maxWidth:980,margin:'0 auto',padding:'0 20px'}}>
        <h1 style={{textAlign:'center'}}>Gestión de Órdenes (Admin)</h1>

        <div style={{display:'flex',gap:12,justifyContent:'center',alignItems:'center',margin:'14px 0'}}>
          <input placeholder='Buscar por id, cliente o dirección' value={q} onChange={e=>{ setQ(e.target.value); setPagina(1) }} style={{padding:8,borderRadius:6,border:'1px solid #ddd',minWidth:300}} />
          <select value={status} onChange={e=>{ setStatus(e.target.value); setPagina(1) }} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}}>
            <option value='todos'>Todos los estados</option>
            <option value='Pendiente'>Pendiente</option>
            <option value='Enviado'>Enviado</option>
            <option value='Entregado'>Entregado</option>
            <option value='Cancelado'>Cancelado</option>
          </select>
        </div>

        <div style={{display:'grid',gap:12}}>
          {pageItems.length === 0 ? (
            <div style={{textAlign:'center',padding:24}}>No hay órdenes que coincidan.</div>
          ) : (
            pageItems.map(o=> (
              <div key={o.id} style={{padding:12,border:'1px solid #e7e7e7',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700}}>Orden #{o.id} · <span style={{color:'#666',fontWeight:500}}>{new Date(o.fecha).toLocaleString()}</span></div>
                  <div style={{color:'#555'}}>Cliente ID: {o.usuarioId} · Total: S/ {o.total} · {o.envio?.nombre || 'Sin nombre'}</div>
                  <div style={{color:'#444',marginTop:6}}><strong>Estado:</strong> {o.estado}</div>
                </div>

                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <button onClick={()=> navigate(`/orden/${o.id}`)} style={{padding:'8px 10px',borderRadius:6,border:'1px solid #cfcfcf',background:'#e6c89cff',cursor:'pointer'}}>Ver detalle</button>
                  {o.estado === 'Pendiente' && (
                    <button onClick={()=> handleCancel(o)} style={{padding:'8px 10px',borderRadius:6,border:'none',background:'#ff6b6b',color:'#fff',cursor:'pointer'}}>Cancelar</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16,alignItems:'center'}}>
          <button onClick={()=> goToPage(pagina-1)} disabled={pagina===1} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}}>Anterior</button>
          <div style={{padding:'6px 10px',borderRadius:6,border:'1px solid #eee',background:'#fafafa'}}>Página {pagina} / {totalPaginas}</div>
          <button onClick={()=> goToPage(pagina+1)} disabled={pagina===totalPaginas} style={{padding:8,borderRadius:6,border:'1px solid #ddd'}}>Siguiente</button>
        </div>
      </div>
    </section>
  )
}
