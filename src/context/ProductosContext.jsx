// src/context/ProductosContext.jsx
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

const ProductosContext = createContext();
export const useProductos = () => {
  const ctx = useContext(ProductosContext);
  if (!ctx) throw new Error('useProductos debe usarse dentro de ProductosProvider');
  return ctx;
};

const API_URL = 'http://localhost:5000';

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [guardados, setGuardados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // === CARGAR PRODUCTOS DESDE LA API ===
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setCargando(true);
        setError(null);
        const res = await fetch(`${API_URL}/productos`);
        if (!res.ok) throw new Error('Error al cargar productos');
        const data = await res.json();

        setProductos(data || []);

        // Sacar categorías únicas desde los productos
        const cats = Array.from(
          new Set((data || []).map((p) => p.categoria).filter(Boolean))
        );
        // Puedes forzar tus categorías base si quieres
        setCategorias(cats);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, []);

  // === APLICAR DESCUENTOS (Brainy -30%) ===
  const productosConDescuento = useMemo(() => {
    return productos.map((p) => {
      if (p.categoria?.toLowerCase() === 'brainy') {
        const precioDescuento = +(p.precio * 0.7).toFixed(2);
        return {
          ...p,
          precioDescuento,
          tieneDescuento: true,
        };
      }
      return {
        ...p,
        precioDescuento: p.precio,
        tieneDescuento: false,
      };
    });
  }, [productos]);

  // ======================================================
  //   CRUD PRODUCTOS contra el backend
  // ======================================================

  const agregarProducto = async (producto) => {
    try {
      const res = await fetch(`${API_URL}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(producto),
      });
      if (!res.ok) throw new Error('Error al agregar producto');
      const nuevo = await res.json();
      setProductos((prev) => [...prev, nuevo]);
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo agregar el producto');
    }
  };

  const eliminarProducto = async (id) => {
    try {
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar producto');
      setProductos((prev) => prev.filter((p) => p.id !== id));
      // también limpiar carrito y guardados de ese producto
      setCarrito((prev) => prev.filter((i) => i.id !== id));
      setGuardados((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo eliminar el producto');
    }
  };

  const actualizarProducto = async (prod) => {
    try {
      const res = await fetch(`${API_URL}/productos/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      if (!res.ok) throw new Error('Error al actualizar producto');
      const actualizado = await res.json();
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo actualizar el producto');
    }
  };

  const toggleActivo = async (id) => {
    try {
      const producto = productos.find((p) => p.id === id);
      if (!producto) return;
      const res = await fetch(`${API_URL}/productos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...producto, activo: !producto.activo }),
      });
      if (!res.ok) throw new Error('Error al cambiar estado de producto');
      const actualizado = await res.json();
      setProductos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p))
      );
    } catch (err) {
      console.error(err);
      alert(err.message || 'No se pudo cambiar el estado del producto');
    }
  };

  const agregarCategoria = (nombre) => {
    if (!nombre || !nombre.trim()) return;
    setCategorias((prev) =>
      prev.includes(nombre.trim()) ? prev : [...prev, nombre.trim()]
    );
  };

  // ======================================================
  //   CARRITO y GUARDADOS (solo en memoria, sin localStorage)
  // ======================================================

  const agregarAlCarrito = (producto, cantidad = 1) => {
    if (!producto || producto.activo === false) return;

    setCarrito((prev) => {
      const found = prev.find((i) => i.id === producto.id);
      if (found) {
        return prev.map((i) =>
          i.id === producto.id
            ? { ...i, cantidad: (i.cantidad || 0) + cantidad }
            : i
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
  };

  const quitarDelCarrito = (id) =>
    setCarrito((prev) => prev.filter((i) => i.id !== id));

  const cambiarCantidad = (id, cantidad) =>
    setCarrito((prev) =>
      prev.map((i) => (i.id === id ? { ...i, cantidad } : i))
    );

  const limpiarCarrito = () => setCarrito([]);

  const guardarParaDespues = (id) => {
    const item = carrito.find((i) => i.id === id);
    if (!item) return;
    setGuardados((prev) => [...prev, item]);
    setCarrito((prev) => prev.filter((i) => i.id !== id));
  };

  const regresarAlCarrito = (id) => {
    const item = guardados.find((i) => i.id === id);
    if (!item) return;
    setGuardados((prev) => prev.filter((g) => g.id !== id));
    setCarrito((prev) => [...prev, item]);
  };

  const eliminarGuardado = (id) =>
    setGuardados((prev) => prev.filter((i) => i.id !== id));

  return (
    <ProductosContext.Provider
      value={{
        productos: productosConDescuento,
        cargando,
        error,
        // productos CRUD
        agregarProducto,
        eliminarProducto,
        actualizarProducto,
        toggleActivo,
        // carrito
        carrito,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,
        limpiarCarrito,
        // guardados
        guardados,
        guardarParaDespues,
        regresarAlCarrito,
        eliminarGuardado,
        // categorías
        categorias,
        agregarCategoria,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}
