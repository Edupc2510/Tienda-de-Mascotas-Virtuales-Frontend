import React, { useState } from 'react'
import { useUsuarios } from '../../context/UsuariosContext'

export default function AdminUsuarios(){
  const { usuarios, adminToggleUser, updateUsuario } = useUsuarios()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)
  const [editUser, setEditUser] = useState(null)

  const filtered = usuarios.filter(u=> u.nombre.toLowerCase().includes(q.toLowerCase()) || String(u.id).includes(q) || (u.apellido||'').toLowerCase().includes(q.toLowerCase()) )

  const toggleOpen = (u) => {
    if (openId === u.id) {
      setOpenId(null)
      setEditUser(null)
    } else {
      setOpenId(u.id)
      setEditUser({ ...u })
    }
  }

  const handleSave = () => {
    if (!editUser) return
    const { id, nombre, apellido, role } = editUser
    updateUsuario(id, { nombre, apellido, role })
    setOpenId(null)
    setEditUser(null)
  }

  return (
    <section>
      <div style={{maxWidth:980,margin:'0 auto',padding:'0 20px'}}>
        <h1 style={{textAlign:'center'}}>Lista de usuarios</h1>

        <div style={{display:'flex',justifyContent:'center',margin:'12px 0'}}>
          <input placeholder="Filtrar por id, nombre o apellido" value={q} onChange={e=>setQ(e.target.value)} style={{padding:8,minWidth:260,borderRadius:6,border:'1px solid #ddd'}} />
        </div>

        <div style={{display:'grid',gap:12}}>
        {filtered.map(u=> (
          <div key={u.id} style={{padding:12,border:'1px solid #e7e7e7',borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700}}>{u.nombre} {u.apellido} <span style={{marginLeft:8,color:'#666',fontWeight:500}}>#{u.id}</span></div>
              <div style={{color:'#555'}}>{u.email} · <strong style={{marginLeft:6}}>{u.role}</strong></div>
            </div>

            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <div style={{padding:'6px 10px',borderRadius:999,background:u.activo? '#28c76f':'#ff6b6b',color:'#fff',fontWeight:700}}>{u.activo? 'Activo':'Inactivo'}</div>
              <button onClick={()=> toggleOpen(u)} style={{padding:'6px 10px',borderRadius:6,border:'1px solid #cfcfcf',background:'#f3f4f6',color:'#111',cursor:'pointer'}}>Ver</button>
              <button onClick={()=> adminToggleUser(u.id)} style={{padding:'6px 10px',borderRadius:6,border:'none',background:'#e5ad2cff',color:'#fff',cursor:'pointer'}}>{u.activo? 'Desactivar':'Activar'}</button>
            </div>

            {openId === u.id && (
              <div style={{position:'relative',marginTop:12,gridColumn:'1/-1',width:'100%'}}>
                <div style={{marginTop:12,padding:12,borderTop:'1px solid #eee'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                    <label>
                      Nombre
                      <input value={editUser?.nombre||''} onChange={e=>setEditUser(s=>({...s,nombre:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                    </label>
                    <label>
                      Apellido
                      <input value={editUser?.apellido||''} onChange={e=>setEditUser(s=>({...s,apellido:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ddd'}} />
                    </label>
                    <label>
                      Email
                      <input value={editUser?.email||''} readOnly style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #eee',background:'#fafafa'}} />
                    </label>
                    <label>
                      Rol
                      <select value={editUser?.role||'user'} onChange={e=>setEditUser(s=>({...s,role:e.target.value}))} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #ddd'}}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </label>
                  </div>

                  <div style={{marginTop:10,display:'flex',gap:8}}>
                    <button onClick={handleSave} style={{padding:'8px 12px',background:'#16a34a',color:'#fff',border:'none',borderRadius:6,cursor:'pointer'}}>Guardar</button>
                    <button onClick={()=> { setOpenId(null); setEditUser(null); }} style={{padding:'8px 12px',background:'#ccccccff',border:'1px solid #e5e7eb',borderRadius:6}}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        </div>
      </div>
    </section>
  )
}
