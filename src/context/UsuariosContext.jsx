// src/context/UsuariosContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const UsuariosContext = createContext();

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

  // ==========================
  // CARGAR USUARIOS Y ÓRDENES
  // ==========================
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        setCargando(true);
        setError(null);

        // Usuarios
        const resU = await fetch(`${API_URL}/usuarios`);
        if (!resU.ok) throw new Error("Error al cargar usuarios");
        const dataU = await resU.json();
        setUsuarios(dataU || []);

        // Órdenes (solo si hay usuario logueado)
        if (usuarioLogueado?.id) {
          const resO = await fetch(`${API_URL}/ordenes?usuarioId=${usuarioLogueado.id}`);
          if (!resO.ok) throw new Error("Error al cargar órdenes");
          const dataO = await resO.json();
          setOrdenes(dataO || []);
        } else {
          setOrdenes([]);
        }
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchInicial();
  }, [usuarioLogueado?.id]);

  // ==========================
  // REGISTRO
  // ==========================
  const register = async ({ nombre = "", apellido = "", email, password }) => {
    if (!email || !password) throw new Error("Faltan datos");

    const exists = usuarios.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
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
      (u) => u.email.toLowerCase() === (email || "").toLowerCase()
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
  // CANCELAR ORDEN (usa DELETE /ordenes/:id)
  // Asumimos que tu backend NO borra físico, sino que setea estado=Cancelado
  // ==========================
  const cancelOrder = async (id) => {
    const res = await fetch(`${API_URL}/ordenes/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al cancelar orden");
    }

    // Tu backend puede devolver:
    // A) { mensaje: "Orden eliminada" }  (tu delete actual)
    // B) la orden actualizada
    const data = await res.json().catch(() => ({}));

    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === id
          ? (typeof data === "object" && data?.id ? data : { ...o, estado: "Cancelado" })
          : o
      )
    );

    return data;
  };

  // ==========================
  // ACTIVAR/DESACTIVAR USUARIO (ADMIN)
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

    if (usuarioLogueado?.id === id) {
      const updatedLogueado = {
        ...usuarioLogueado,
        nombre: actualizado.nombre,
        apellido: actualizado.apellido,
        email: actualizado.email,
      };
      setUsuarioLogueado(updatedLogueado);
      localStorage.setItem("usuarioLogueado", JSON.stringify(updatedLogueado));
    }
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
