// src/paginas/OrderDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUsuarios } from "../context/UsuariosContext";
import "./OrderDetail.css";

const API_URL = "https://kozzyserverapi.azurewebsites.net";

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

  // Items a mostrar: preferimos detalle (porque trae producto con nombre)
  const itemsParaMostrar = useMemo(() => {
    if (!orden) return [];
    if (Array.isArray(orden.detalle) && orden.detalle.length > 0) {
      // detalle: [{ productoId, cantidad, precioUnitario, producto: {...} }, ...]
      return orden.detalle.map((d) => ({
        key: `${d.ordenId}-${d.productoId}`,
        nombre: d.producto?.nombre ?? `Producto #${d.productoId}`,
        cantidad: Number(d.cantidad ?? 1),
        precioUnitario: Number(d.precioUnitario ?? 0),
        // por si quieres imagen luego:
        imagen: d.producto?.imagen ?? d.producto?.image ?? null,
      }));
    }

    // fallback: items normalizados (productoId, cantidad, precio)
    return (orden.items || []).map((it, idx) => ({
      key: it.id ?? `${it.productoId ?? it.id}-${idx}`,
      nombre:
        it.nombre ??
        (it.productoId || it.id ? `Producto #${it.productoId ?? it.id}` : "Producto"),
      cantidad: Number(it.cantidad ?? 1),
      precioUnitario: Number(it.precio ?? it.precioUnitario ?? 0),
      imagen: it.imagen ?? it.image ?? null,
    }));
  }, [orden]);

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
      <p>
        <strong>Fecha:</strong>{" "}
        {new Date(orden.createdAt || orden.fecha).toLocaleString()}
      </p>
      <p>
        <strong>Estado:</strong> {orden.estado}
      </p>
      <p>
        <strong>Total:</strong> S/ {Number(orden.total ?? 0).toFixed(2)}
      </p>

      <h3>🛒 Productos</h3>
      <ul className="order-items">
        {itemsParaMostrar.length === 0 ? (
          <li>No hay productos en esta orden.</li>
        ) : (
          itemsParaMostrar.map((it) => (
            <li key={it.key}>
              {it.nombre} x{it.cantidad} — S/{" "}
              {(it.precioUnitario * it.cantidad).toFixed(2)}
            </li>
          ))
        )}
      </ul>

      <h3>🚚 Envío</h3>
      <p>
        <strong>Nombre:</strong> {orden.envio?.nombre}
      </p>
      <p>
        <strong>Dirección:</strong> {orden.envio?.direccion}
      </p>
      <p>
        <strong>Ciudad:</strong> {orden.envio?.ciudad}
      </p>
      <p>
        <strong>Método:</strong>{" "}
        {orden.envio?.metodo === "tienda" ? "Recoger en tienda" : "Delivery"}
      </p>

      <h3>💳 Pago</h3>
      <p>
        <strong>Método:</strong>{" "}
        {orden.pago?.metodo === "tarjeta" ? "Tarjeta" : "Código QR"}
      </p>

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
