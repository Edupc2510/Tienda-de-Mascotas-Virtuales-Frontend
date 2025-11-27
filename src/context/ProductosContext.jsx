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
const SAVED_KEY = "guardados";

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

  const [guardados, setGuardados] = useState(() => {
    try {
      const stored = localStorage.getItem(SAVED_KEY);
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

  // Persistir guardados
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(guardados));
    } catch (e) {
      console.error("No se pudo guardar guardados en localStorage:", e);
    }
  }, [guardados]);

  // Sync entre tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CART_KEY) {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : [];
          setCarrito(Array.isArray(next) ? next : []);
        } catch {
          setCarrito([]);
        }
      }

      if (e.key === SAVED_KEY) {
        try {
          const next = e.newValue ? JSON.parse(e.newValue) : [];
          setGuardados(Array.isArray(next) ? next : []);
        } catch {
          setGuardados([]);
        }
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

  // helper: algunos items podrían venir con productoId (por si acaso)
  const getId = (x) => x?.id ?? x?.productoId;

  const addToCarrito = (producto, cantidad = 1) => {
    const id = getId(producto);
    if (id === null || id === undefined) return;

    const qty = Math.max(1, Number(cantidad || 1));

    setCarrito((prev) => {
      const idx = prev.findIndex((x) => getId(x) === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], cantidad: (copy[idx].cantidad || 1) + qty };
        return copy;
      }
      // aseguramos que SIEMPRE exista item.id para tu Carrito.jsx
      return [...prev, { ...producto, id, cantidad: qty }];
    });
  };

  // alias (compatibilidad con tu front)
  const agregarAlCarrito = addToCarrito;

  const quitarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((x) => getId(x) !== id));
  };

  const cambiarCantidad = (id, cantidad) => {
    const qty = Math.max(1, Number(cantidad || 1));
    setCarrito((prev) =>
      prev.map((x) => (getId(x) === id ? { ...x, cantidad: qty } : x))
    );
  };

  // ✅ este es el que tu Checkout llama
  const limpiarCarrito = () => {
    setCarrito([]);
    try {
      localStorage.removeItem(CART_KEY);
      localStorage.setItem(CART_KEY, JSON.stringify([]));
    } catch (e) {
      console.error("No se pudo limpiar carrito en localStorage:", e);
    }
  };

  // alias
  const vaciarCarrito = limpiarCarrito;

  // =========================
  // Guardar para después (lo que tu /carrito espera)
  // =========================
  const guardarParaDespues = (id) => {
    setCarrito((prevCarrito) => {
      const item = prevCarrito.find((x) => getId(x) === id);
      if (!item) return prevCarrito;

      setGuardados((prevGuardados) => {
        const idx = prevGuardados.findIndex((g) => getId(g) === id);
        if (idx >= 0) {
          const copy = [...prevGuardados];
          copy[idx] = {
            ...copy[idx],
            cantidad: (copy[idx].cantidad || 1) + (item.cantidad || 1),
          };
          return copy;
        }
        return [...prevGuardados, item];
      });

      return prevCarrito.filter((x) => getId(x) !== id);
    });
  };

  const regresarAlCarrito = (id) => {
    setGuardados((prevGuardados) => {
      const item = prevGuardados.find((g) => getId(g) === id);
      if (!item) return prevGuardados;

      // lo pasamos al carrito sumando cantidad si ya existe
      addToCarrito(item, item.cantidad || 1);

      return prevGuardados.filter((g) => getId(g) !== id);
    });
  };

  const eliminarGuardado = (id) => {
    setGuardados((prev) => prev.filter((g) => getId(g) !== id));
  };

  return (
    <ProductosContext.Provider
      value={{
        productos,
        setProductos,
        cargandoProductos,
        errorProductos,

        carrito,
        guardados,

        addToCarrito,
        agregarAlCarrito,
        quitarDelCarrito,
        cambiarCantidad,

        limpiarCarrito,
        vaciarCarrito,

        guardarParaDespues,
        regresarAlCarrito,
        eliminarGuardado,

        categorias,
      }}
    >
      {children}
    </ProductosContext.Provider>
  );
}
