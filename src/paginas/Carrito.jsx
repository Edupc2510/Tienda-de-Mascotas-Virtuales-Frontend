import React from 'react'
import { useProductos } from '../context/ProductosContext'
import { Link } from 'react-router-dom'

export default function Carrito() {
  const { carrito, quitarDelCarrito, cambiarCantidad, guardarParaDespues, guardados, regresarAlCarrito, eliminarGuardado } = useProductos()

  const calcularPrecio = (item) => item.tieneDescuento ? item.precioDescuento : item.precio

  const total = carrito
    .reduce((s, i) => s + (calcularPrecio(i) * (i.cantidad || 1)), 0)
    .toFixed(2)

  const styles = {
    page: {
      maxWidth: 1100,
      margin: '0 auto',
      padding: '28px 18px',
    },
    header: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 14,
    },
    title: {
      fontSize: '2rem',
      margin: 0,
      color: '#222',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      margin: 0,
      color: '#666',
      fontSize: '.95rem',
    },
    layout: {
      display: 'grid',
      gridTemplateColumns: '1.6fr .9fr',
      gap: 16,
      alignItems: 'start',
    },
    card: {
      background: '#fff',
      border: '1px solid #eee',
      borderRadius: 16,
      boxShadow: '0 8px 24px rgba(0,0,0,.06)',
    },
    cardPad: {
      padding: 16,
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'grid',
      gap: 12,
    },
    item: {
      display: 'grid',
      gridTemplateColumns: '88px 1fr auto',
      gap: 12,
      padding: 12,
      borderRadius: 14,
      border: '1px solid #f0f0f0',
      background: '#fff',
    },
    imgWrap: {
      width: 88,
      height: 88,
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid #f1f1f1',
      background: '#fafafa',
      display: 'grid',
      placeItems: 'center',
    },
    img: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
    },
    name: { margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#222' },
    small: { margin: '6px 0 0', color: '#666', fontSize: '.92rem' },
    priceBlock: { display: 'grid', gap: 2, marginTop: 6 },
    priceLine: { margin: 0, fontSize: '.92rem', color: '#888', textDecoration: 'line-through' },
    priceFinal: { margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#222' },
    qtyRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' },
    label: { color: '#555', fontSize: '.92rem', fontWeight: 700 },
    input: {
      width: 88,
      padding: '8px 10px',
      borderRadius: 10,
      border: '1px solid #e6e6e6',
      outline: 'none',
    },
    actions: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch' },
    btn: {
      padding: '9px 12px',
      borderRadius: 12,
      border: '1px solid #e7e7e7',
      background: '#f7f7f7',
      cursor: 'pointer',
      fontWeight: 800,
      color: '#222',
    },
    btnDanger: {
      padding: '9px 12px',
      borderRadius: 12,
      border: 'none',
      background: '#ff6b6b',
      cursor: 'pointer',
      fontWeight: 900,
      color: '#fff',
    },
    btnPrimary: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 14,
      border: 'none',
      background: '#111',
      cursor: 'pointer',
      fontWeight: 900,
      color: '#fff',
      fontSize: '1rem',
    },
    link: { color: '#111', fontWeight: 900, textDecoration: 'none' },
    divider: { height: 1, background: '#eee', margin: '12px 0' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
    totalLabel: { margin: 0, color: '#444', fontWeight: 900 },
    totalValue: { margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#111' },
    empty: { padding: 18, color: '#555' },
    sectionTitle: { margin: 0, padding: '14px 16px', fontSize: '1.1rem', fontWeight: 900, color: '#222' },
    hint: { margin: 0, color: '#777', fontSize: '.92rem' },
  }

  return (
    <section className="carrito" style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Carrito de compras</h1>
        <p style={styles.subtitle}>
          <Link to="/productos" style={styles.link}>Seguir comprando</Link>
        </p>
      </div>

      <div style={styles.layout}>
        {/* Izquierda: items */}
        <div style={{ ...styles.card, ...styles.cardPad }}>
          {carrito.length === 0 ? (
            <div style={styles.empty}>
              Tu carrito está vacío. <Link to="/productos" style={styles.link}>Ver productos</Link>
            </div>
          ) : (
            <>
              <ul className="lista-productos" style={styles.list}>
                {carrito.map(item => (
                  <li key={item.id} className="producto-item" style={styles.item}>
                    <div style={styles.imgWrap}>
                      <img src={item.imagenUrl} alt={item.nombre} style={styles.img} />
                    </div>

                    <div className="contenido">
                      <h4 style={styles.name}>{item.nombre}</h4>

                      {item.tieneDescuento ? (
                        <div className="precio" style={styles.priceBlock}>
                          <p className="precio-original" style={styles.priceLine}>
                            S/ {item.precio.toFixed(2)}
                          </p>
                          <p className="precio-descuento" style={styles.priceFinal}>
                            S/ {item.precioDescuento.toFixed(2)}
                          </p>
                        </div>
                      ) : (
                        <p className="small" style={styles.small}>S/ {item.precio.toFixed(2)}</p>
                      )}

                      <div style={styles.qtyRow}>
                        <label style={styles.label}>Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => cambiarCantidad(item.id, Number(e.target.value))}
                          style={styles.input}
                        />
                      </div>
                    </div>

                    <div className="acciones" style={styles.actions}>
                      <button style={styles.btn} onClick={() => guardarParaDespues(item.id)}>
                        Guardar para después
                      </button>
                      <button style={styles.btnDanger} onClick={() => quitarDelCarrito(item.id)}>
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Derecha: resumen */}
        <aside style={{ ...styles.card, padding: 16, position: 'sticky', top: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#222' }}>
            Resumen del pedido
          </h3>
          <p style={{ ...styles.hint, marginTop: 6 }}>
            Revisa tu total antes de pagar.
          </p>

          <div style={styles.divider} />

          <div style={styles.summaryRow}>
            <p style={styles.totalLabel}>Total</p>
            <p style={styles.totalValue}>S/ {total}</p>
          </div>

          <div style={{ marginTop: 12 }}>
            <Link to="/checkout" style={{ textDecoration: 'none' }}>
              <button style={styles.btnPrimary} disabled={carrito.length === 0}>
                Ir a pagar
              </button>
            </Link>
          </div>

          <div style={styles.divider} />

          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#222' }}>
            Guardados para después
          </h3>

          <div style={{ marginTop: 10 }}>
            {guardados.length === 0 ? (
              <p style={styles.hint}>No hay ítems guardados.</p>
            ) : (
              <ul className="lista-productos" style={{ ...styles.list, gap: 10 }}>
                {guardados.map(g => (
                  <li key={g.id} className="producto-item" style={{ ...styles.item, gridTemplateColumns: '64px 1fr' }}>
                    <div style={{ ...styles.imgWrap, width: 64, height: 64, borderRadius: 12 }}>
                      <img src={g.imagenUrl} alt={g.nombre} style={styles.img} />
                    </div>

                    <div className="contenido" style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                        <h4 style={{ ...styles.name, fontSize: '1rem' }}>{g.nombre}</h4>
                        {g.tieneDescuento ? (
                          <span style={{ fontWeight: 900, color: '#111' }}>
                            S/ {g.precioDescuento.toFixed(2)}
                          </span>
                        ) : (
                          <span style={{ fontWeight: 900, color: '#111' }}>
                            S/ {g.precio.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button style={styles.btn} onClick={() => regresarAlCarrito(g.id)}>
                          Regresar al carrito
                        </button>
                        <button style={styles.btnDanger} onClick={() => eliminarGuardado(g.id)}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Responsive sencillo sin tocar CSS: si quieres, pon esto en tu CSS luego */}
      <style>{`
        @media (max-width: 900px){
          .carrito > div[style*="grid-template-columns"]{
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}
