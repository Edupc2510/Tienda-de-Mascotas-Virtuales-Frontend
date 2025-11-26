// src/context/ProductosContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ProductosContext = createContext(null);

export const useProductos = () => {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error("useProductos debe usarse dentro de ProductosProvider");
  return ctx;
};

const API_URL = "https://kozzyserverapi.azurewebsites.net";

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState(null);

  const [carrito, setCarrito] = useState(() => {
    const stored = localStorage.getItem("carrito");
    return stored ? JSON.parse(stored) : [];
  });

  // Persistir carrito
  useEffect(() => {
    localStorage.setItem("carrito", JSON.stringify(carrito));
  }, [carrito]);

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
    const qty = Number(cantidad || 1);

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

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((x) => x.id !== id));
  };

  const cambiarCantidad = (id, cantidad) => {
    const qty = Math.max(1, Number(cantidad || 1));
    setCarrito((prev) =>
      prev.map((x) => (x.id === id ? { ...x, cantidad: qty } : x))
    );
  };

  const vaciarCarrito = () => setCarrito([]);

  return (
    <ProductosContext.Provider
      value={{
        productos,
        setProductos,
        cargandoProductos,
        errorProductos,

        carrito,
        addToCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        vaciarCarrito,

        categorias,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}
