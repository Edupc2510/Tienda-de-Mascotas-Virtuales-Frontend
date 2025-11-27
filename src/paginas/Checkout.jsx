import React, { useState } from "react";
import { useProductos } from "../context/ProductosContext";
import { useUsuarios } from "../context/UsuariosContext";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

export default function Checkout() {
  const { carrito, limpiarCarrito } = useProductos();
  const { usuarioLogueado, addOrder } = useUsuarios();
  const navigate = useNavigate();

  const [envio, setEnvio] = useState({
    nombre: "",
    direccion: "",
    ciudad: "",
    metodo: "delivery",
  });
  const [pago, setPago] = useState({ metodo: "qr", tarjeta: "" });

  const totalNumber = carrito.reduce(
    (s, i) => s + i.precio * (i.cantidad || 1),
    0
  );
  const total = totalNumber.toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!usuarioLogueado) {
      alert("Debes iniciar sesión para completar la compra");
      navigate("/login");
      return;
    }

    if (!envio.nombre || !envio.direccion || !envio.ciudad) {
      alert("Completa todos los datos de envío");
      return;
    }

    const order = {
      usuarioId: usuarioLogueado.id,
      items: carrito,
      envio,
      pago,
      total: totalNumber, // número para la BD
    };

    try {
      const newOrder = await addOrder(order);
      limpiarCarrito && limpiarCarrito();
      alert(`Orden creada con éxito 🐾 (ID: ${newOrder.id})`);
      navigate("/order-complete");
    } catch (err) {
      alert(err.message || "No se pudo completar la orden");
    }
  };

  return (
    <section className="checkout-page">
      <div className="checkout-header">
        <div>
          <h1 className="checkout-title">Checkout</h1>
          <p className="checkout-subtitle">
            Revisa tus datos y completa tu compra ✨
          </p>
        </div>

        <button
          type="button"
          className="checkout-back"
          onClick={() => navigate("/carrito")}
        >
          Volver al carrito
        </button>
      </div>

      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-card checkout-form">
          <div className="checkout-section">
            <h3 className="section-title">Dirección de envío</h3>

            <div className="field-grid">
              <div className="field">
                <label className="label">Nombre</label>
                <input
                  className="input"
                  placeholder="Ej: Eduardo Pantoja"
                  value={envio.nombre}
                  onChange={(e) => setEnvio({ ...envio, nombre: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Ciudad</label>
                <input
                  className="input"
                  placeholder="Ej: Lima"
                  value={envio.ciudad}
                  onChange={(e) => setEnvio({ ...envio, ciudad: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Dirección</label>
              <input
                className="input"
                placeholder="Ej: Av. Siempre Viva 123"
                value={envio.direccion}
                onChange={(e) =>
                  setEnvio({ ...envio, direccion: e.target.value })
                }
              />
            </div>
          </div>

          <div className="checkout-section">
            <h3 className="section-title">Método de envío</h3>

            <div className="pill-row">
              <label className={`pill ${envio.metodo === "delivery" ? "pill-active" : ""}`}>
                <input
                  type="radio"
                  name="metodoEnvio"
                  checked={envio.metodo === "delivery"}
                  onChange={() => setEnvio({ ...envio, metodo: "delivery" })}
                />
                Delivery a domicilio
              </label>

              <label className={`pill ${envio.metodo === "tienda" ? "pill-active" : ""}`}>
                <input
                  type="radio"
                  name="metodoEnvio"
                  checked={envio.metodo === "tienda"}
                  onChange={() => setEnvio({ ...envio, metodo: "tienda" })}
                />
                Recoger en tienda
              </label>
            </div>
          </div>

          <div className="checkout-section">
            <h3 className="section-title">Método de pago</h3>

            <div className="pill-row">
              <label className={`pill ${pago.metodo === "qr" ? "pill-active" : ""}`}>
                <input
                  type="radio"
                  name="pago"
                  checked={pago.metodo === "qr"}
                  onChange={() => setPago({ ...pago, metodo: "qr" })}
                />
                Código QR
              </label>

              <label className={`pill ${pago.metodo === "tarjeta" ? "pill-active" : ""}`}>
                <input
                  type="radio"
                  name="pago"
                  checked={pago.metodo === "tarjeta"}
                  onChange={() => setPago({ ...pago, metodo: "tarjeta" })}
                />
                Tarjeta
              </label>
            </div>

            {pago.metodo === "qr" ? (
              <div className="qr-box">
                <img src="/images/qr.svg" alt="QR" className="qr-image" />
                <p className="qr-text">Escanea y paga (simulado)</p>
              </div>
            ) : (
              <div className="card-box">
                <div className="field-grid">
                  <div className="field">
                    <label className="label">Número de tarjeta</label>
                    <input className="input" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="field">
                    <label className="label">MM/AA</label>
                    <input className="input" placeholder="11/28" />
                  </div>
                </div>
                <div className="field">
                  <label className="label">CVC</label>
                  <input className="input" placeholder="123" />
                </div>
              </div>
            )}
          </div>

          <div className="checkout-actions">
            <button type="submit" className="btn-primary" disabled={carrito.length === 0}>
              Completar orden
            </button>
            <p className="tiny-note">
              Al continuar, tu pago es simulado y se registrará la orden.
            </p>
          </div>
        </form>

        <aside className="checkout-card checkout-summary">
          <div className="summary-head">
            <h3 className="section-title" style={{ margin: 0 }}>Resumen del pedido</h3>
            <span className="badge">{carrito.length} ítems</span>
          </div>

          {carrito.length === 0 ? (
            <p className="empty">Tu carrito está vacío.</p>
          ) : (
            <ul className="summary-list">
              {carrito.map((i) => (
                <li key={i.id} className="summary-item">
                  <div className="summary-left">
                    <span className="summary-name">{i.nombre}</span>
                    <span className="summary-qty">x{i.cantidad || 1}</span>
                  </div>
                  <span className="summary-price">
                    S/ {(i.precio * (i.cantidad || 1)).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="divider" />

          <div className="summary-total">
            <span>Total</span>
            <strong>S/ {total}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
