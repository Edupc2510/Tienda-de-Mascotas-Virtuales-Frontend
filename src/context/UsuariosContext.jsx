// src/context/UsuariosContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const UsuariosContext = createContext(null);

export const useUsuarios = () => {
  const ctx = useContext(UsuariosContext);
  if (!ctx) throw new Error("useUsuarios debe usarse dentro de UsuariosProvider");
  return ctx;
};

const API_URL = "https://kozzyserverapi.azurewebsites.net";

export function UsuariosProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const stored = localStorage.getItem("usuarioLogueado");
    return stored ? JSON.parse(stored) : null;
  });

  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const esAdmin = (u) => String(u?.role || "").toLowerCase() === "admin";

  // ==========================
  // CARGAR USUARIOS + SINCRONIZAR usuarioLogueado Y CARGAR ÓRDENES
  // - Admin: /ordenes (todas)
  // - User : /ordenes?usuarioId=...
  // ==========================
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        setCargando(true);
        setError(null);

        // 1) Usuarios
        const resU = await fetch(`${API_URL}/usuarios`);
        if (!resU.ok) throw new Error("Error al cargar usuarios");
        const dataU = await resU.json();
        const listaUsuarios = Array.isArray(dataU) ? dataU : [];
        setUsuarios(listaUsuarios);

        // 2) Si hay sesión, sincroniza datos (incluye role desde BD)
        let current = usuarioLogueado;

        if (usuarioLogueado?.id) {
          const uDb = listaUsuarios.find((u) => String(u.id) === String(usuarioLogueado.id));
          if (uDb) {
            const synced = {
              ...usuarioLogueado,
              nombre: uDb.nombre ?? usuarioLogueado.nombre,
              apellido: uDb.apellido ?? usuarioLogueado.apellido,
              email: uDb.email ?? usuarioLogueado.email,
              role: uDb.role ?? usuarioLogueado.role,
            };

            // actualiza localStorage solo si cambió algo relevante
            const changed =
              synced.nombre !== usuarioLogueado.nombre ||
              synced.apellido !== usuarioLogueado.apellido ||
              synced.email !== usuarioLogueado.email ||
              synced.role !== usuarioLogueado.role;

            if (changed) {
              setUsuarioLogueado(synced);
              localStorage.setItem("usuarioLogueado", JSON.stringify(synced));
            }

            current = synced;
          }
        }

        // 3) Órdenes
        if (current?.id) {
          const url = esAdmin(current)
            ? `${API_URL}/ordenes`
            : `${API_URL}/ordenes?usuarioId=${encodeURIComponent(current.id)}`;

          const resO = await fetch(url);
          if (!resO.ok) throw new Error("Error al cargar órdenes");
          const dataO = await resO.json();
          setOrdenes(Array.isArray(dataO) ? dataO : []);
        } else {
          setOrdenes([]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Error cargando datos");
        setOrdenes([]);
      } finally {
        setCargando(false);
      }
    };

    fetchInicial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioLogueado?.id]);

  // ==========================
  // REGISTRO
  // ==========================
  const register = async ({ nombre = "", apellido = "", email, password }) => {
    if (!email || !password) throw new Error("Faltan datos");

    const exists = usuarios.find(
      (u) => String(u.email).toLowerCase() === String(email).toLowerCase()
    );
    if (exists) throw new Error("Ya existe un usuario con ese correo");

    const nuevoUsuario = {
      nombre,
      apellido,
      email,
      password,
      role: "user",
      activo: true,
    };

    const res = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoUsuario),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al registrar usuario");
    }

    const creado = await res.json();
    setUsuarios((prev) => [...prev, creado]);

    const publicUser = {
      id: creado.id,
      nombre: creado.nombre,
      apellido: creado.apellido,
      email: creado.email,
      role: creado.role,
    };

    setUsuarioLogueado(publicUser);
    localStorage.setItem("usuarioLogueado", JSON.stringify(publicUser));
    return publicUser;
  };

  // ==========================
  // LOGIN
  // ==========================
  const login = async ({ email, password }) => {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al iniciar sesión");
    }

    const publicUser = await res.json();
    setUsuarioLogueado(publicUser);
    localStorage.setItem("usuarioLogueado", JSON.stringify(publicUser));
    return publicUser;
  };

  const logout = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem("usuarioLogueado");
    setOrdenes([]);
  };

  // ==========================
  // CAMBIAR CONTRASEÑA
  // ==========================
  const cambiarPassword = async (id, actual, nueva) => {
    const res = await fetch(`${API_URL}/usuarios/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al cambiar la contraseña");
    }

    return await res.json();
  };

  const forgotPassword = (email) =>
    usuarios.some(
      (u) => String(u.email).toLowerCase() === String(email || "").toLowerCase()
    );

  // ==========================
  // CREAR ORDEN (POST)
  // ==========================
  const addOrder = async (order) => {
    if (!usuarioLogueado) throw new Error("No has iniciado sesión");

    const orderData = {
      ...order,
      usuarioId: usuarioLogueado.id,
    };

    const res = await fetch(`${API_URL}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al crear la orden");
    }

    const creada = await res.json();
    setOrdenes((prev) => [creada, ...prev]);
    return creada;
  };

  // ==========================
  // CANCELAR ORDEN (DELETE /ordenes/:id) => backend cambia estado a "Cancelado"
  // ==========================
  const cancelOrder = async (id) => {
    const res = await fetch(`${API_URL}/ordenes/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al cancelar orden");
    }

    const ordenActualizada = await res.json().catch(() => ({}));

    setOrdenes((prev) =>
      prev.map((o) => (o.id === id ? (ordenActualizada?.id ? ordenActualizada : { ...o, estado: "Cancelado" }) : o))
    );

    return ordenActualizada;
  };

  // ==========================
  // ADMIN TOGGLE (solo front: si quieres real, haz endpoint)
  // ==========================
  const adminToggleUser = (id) =>
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );

  // ==========================
  // ACTUALIZAR USUARIO
  // ==========================
  const updateUsuario = async (id, datos) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    const res = await fetch(`${API_URL}/usuarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...usuario, ...datos }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al actualizar usuario");
    }

    const actualizado = await res.json();

    setUsuarios((prev) =>
      prev.map((u) => (u.id === actualizado.id ? actualizado : u))
    );

    // si editaste al mismo usuario logueado, sincroniza localStorage (incluye role)
    if (usuarioLogueado?.id === id) {
      const updatedLogueado = {
        ...usuarioLogueado,
        nombre: actualizado.nombre,
        apellido: actualizado.apellido,
        email: actualizado.email,
        role: actualizado.role ?? usuarioLogueado.role,
      };
      setUsuarioLogueado(updatedLogueado);
      localStorage.setItem("usuarioLogueado", JSON.stringify(updatedLogueado));
    }

    return actualizado;
  };

  return (
    <UsuariosContext.Provider
      value={{
        usuarios,
        usuarioLogueado,
        ordenes,
        cargando,
        error,
        register,
        login,
        logout,
        cambiarPassword,
        forgotPassword,
        addOrder,
        cancelOrder,
        adminToggleUser,
        updateUsuario,
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
}
