// src/paginas/OrderDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUsuarios } from "../context/UsuariosContext";
import "./OrderDetail.css";

const API_URL = "http://localhost:5000";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cancelOrder } = useUsuarios();

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar la orden desde la API
  useEffect(() => {
    const fetchOrden = async () => {
      try {
        setCargando(true);
        setError(null);
        const res = await fetch(`${API_URL}/ordenes/${id}`);
        if (!res.ok) throw new Error("Orden no encontrada");
        const data = await res.json();
        setOrden(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchOrden();
  }, [id]);

  const handleCancel = async () => {
    if (!orden) return;

    if (orden.estado !== "pendiente" && orden.estado !== "Pendiente") {
      alert("Solo puedes cancelar órdenes pendientes 🐾");
      return;
    }

    if (!window.confirm("¿Seguro que deseas cancelar esta orden?")) return;

    try {
      await cancelOrder(orden.id);
      alert("Orden cancelada 🐶");
      setOrden((prev) => (prev ? { ...prev, estado: "Cancelado" } : prev));
    } catch (err) {
      alert(err.message || "No se pudo cancelar la orden");
    }
  };

  if (cargando) {
    return (
      <section className="order-detail card">
        <p>Cargando orden...</p>
      </section>
    );
  }

  if (error || !orden) {
    return (
      <section className="order-detail card">
        <h2>Orden no encontrada</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/mi-cuenta")} className="btn volver">
          Volver a mi cuenta
        </button>
      </section>
    );
  }

  return (
    <section className="order-detail card">
      <h1>📦 Detalle de la orden #{orden.id}</h1>
      <p><strong>Fecha:</strong> {new Date(orden.createdAt || orden.fecha).toLocaleString()}</p>
      <p><strong>Estado:</strong> {orden.estado}</p>
      <p><strong>Total:</strong> S/ {orden.total}</p>

      <h3>🛒 Productos</h3>
      <ul className="order-items">
        {(orden.items || []).map((it) => (
          <li key={it.id}>
            {it.nombre} x{it.cantidad} — S/ {(it.precio * it.cantidad).toFixed(2)}
          </li>
        ))}
      </ul>

      <h3>🚚 Envío</h3>
      <p><strong>Nombre:</strong> {orden.envio?.nombre}</p>
      <p><strong>Dirección:</strong> {orden.envio?.direccion}</p>
      <p><strong>Ciudad:</strong> {orden.envio?.ciudad}</p>
      <p><strong>Método:</strong> {orden.envio?.metodo === "tienda" ? "Recoger en tienda" : "Delivery"}</p>

      <h3>💳 Pago</h3>
      <p><strong>Método:</strong> {orden.pago?.metodo === "tarjeta" ? "Tarjeta" : "Código QR"}</p>

      <div className="order-actions">
        <button onClick={() => navigate("/mi-cuenta")} className="btn volver">
          Volver a mi cuenta
        </button>

        {(orden.estado === "pendiente" || orden.estado === "Pendiente") && (
          <button onClick={handleCancel} className="btn cancelar">
            Cancelar orden
          </button>
        )}
      </div>
    </section>
  );
}

