// src/context/ProductosContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ProductosContext = createContext(null);

export const useProductos = () => {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error("useProductos debe usarse dentro de ProductosProvider");
  return ctx;
};

const API_URL = "https://kozzyserverapi.azurewebsites.net";
const CART_KEY = "carrito";

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState(null);

  const [carrito, setCarrito] = useState(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Persistir carrito
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(carrito));
    } catch (e) {
      console.error("No se pudo guardar carrito en localStorage:", e);
    }
  }, [carrito]);

  // Sync entre tabs (opcional, pero evita “revivir” cosas raras)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== CART_KEY) return;
      try {
        const next = e.newValue ? JSON.parse(e.newValue) : [];
        setCarrito(Array.isArray(next) ? next : []);
      } catch {
        setCarrito([]);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Cargar productos
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setCargandoProductos(true);
        setErrorProductos(null);

        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setErrorProductos(err.message);
      } finally {
        setCargandoProductos(false);
      }
    };

    fetchProductos();
  }, []);

  const categorias = useMemo(() => {
    const set = new Set();
    productos.forEach((p) => {
      if (p?.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [productos]);

  const addToCarrito = (producto, cantidad = 1) => {
    if (!producto?.id) return;
    const qty = Math.max(1, Number(cantidad || 1));

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => x.id === producto.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: (copy[idx].cantidad || 1) + qty };
        return copy;
      }
      return [...prev, { ...producto, cantidad: qty }];
    });
  };

  // alias (compatibilidad con tu front)
  const agregarAlCarrito = addToCarrito;

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((x) => x.id !== id));
  };

  const cambiarCantidad = (id, cantidad) => {
    const qty = Math.max(1, Number(cantidad || 1));
    setCarrito((prev) =>
      prev.map((x) => (x.id === id ? { ...x, cantidad: qty } : x))
    );
  };

  // ✅ este es el que tu Checkout llama
  const limpiarCarrito = () => {
    setCarrito([]);
    try {
      localStorage.removeItem(CART_KEY);
      // por si acaso, dejarlo explícitamente vacío también:
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    } catch (e) {
      console.error("No se pudo limpiar carrito en localStorage:", e);
    }
  };

  // por si en otros lados lo llamas así
  const vaciarCarrito = limpiarCarrito;

  return (
    <ProductosContext.Provider
      value={{
        productos,
        setProductos,
        cargandoProductos,
        errorProductos,

        carrito,

        addToCarrito,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,

        limpiarCarrito, // 👈 IMPORTANTE para tu Checkout
        vaciarCarrito,  // alias

        categorias,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}
