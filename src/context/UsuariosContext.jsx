// src/context/UsuariosContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
    try {
      const stored = localStorage.getItem("usuarioLogueado");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const esAdmin = useMemo(
    () => String(usuarioLogueado?.role || "").toLowerCase() === "admin",
    [usuarioLogueado?.role]
  );

  // ========================================================
  // CARGAR USUARIOS Y ÓRDENES
  // - siempre carga usuarios
  // - si hay usuario logueado:
  //    - sincroniza su role desde BD (por si localStorage está viejo)
  //    - si es admin => trae TODAS las órdenes
  //    - si no => trae solo sus órdenes
  // ========================================================
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

        // 2) Órdenes
        if (!usuarioLogueado?.id) {
          setOrdenes([]);
          return;
        }

        // Sincronizar usuarioLogueado con BD (role/activo/nombre/apellido/email)
        const fromDb = listaUsuarios.find((u) => Number(u.id) === Number(usuarioLogueado.id));
        if (fromDb) {
          const merged = {
            ...usuarioLogueado,
            nombre: fromDb.nombre ?? usuarioLogueado.nombre,
            apellido: fromDb.apellido ?? usuarioLogueado.apellido,
            email: fromDb.email ?? usuarioLogueado.email,
            role: fromDb.role ?? usuarioLogueado.role,
          };

          // Si cambió algo importante (ej role), actualiza localStorage/state
          const changed =
            merged.nombre !== usuarioLogueado.nombre ||
            merged.apellido !== usuarioLogueado.apellido ||
            merged.email !== usuarioLogueado.email ||
            merged.role !== usuarioLogueado.role;

          if (changed) {
            setUsuarioLogueado(merged);
            localStorage.setItem("usuarioLogueado", JSON.stringify(merged));
          }
        }

        const roleFinal = String((fromDb?.role ?? usuarioLogueado.role) || "").toLowerCase();
        const urlOrdenes =
          roleFinal === "admin"
            ? `${API_URL}/ordenes`
            : `${API_URL}/ordenes?usuarioId=${usuarioLogueado.id}`;

        const resO = await fetch(urlOrdenes);
        if (!resO.ok) throw new Error("Error al cargar órdenes");
        const dataO = await resO.json();
        setOrdenes(Array.isArray(dataO) ? dataO : []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error cargando datos");
      } finally {
        setCargando(false);
      }
    };

    fetchInicial();
    // OJO: depende del id/role guardado; role puede actualizarse adentro cuando sincroniza
  }, [usuarioLogueado?.id, usuarioLogueado?.role]);

  // ========================================================
  // REGISTRO
  // ========================================================
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

  // ========================================================
  // LOGIN
  // ========================================================
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

  // ========================================================
  // CAMBIAR CONTRASEÑA
  // ========================================================
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

  // ========================================================
  // CREAR ORDEN (POST)
  // ========================================================
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

  // ========================================================
  // CANCELAR ORDEN (DELETE /ordenes/:id) => estado = "Cancelado"
  // ========================================================
  const cancelOrder = async (id) => {
    const res = await fetch(`${API_URL}/ordenes/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al cancelar orden");
    }

    const ordenActualizada = await res.json().catch(() => null);

    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === id
          ? (ordenActualizada?.id ? ordenActualizada : { ...o, estado: "Cancelado" })
          : o
      )
    );

    return ordenActualizada;
  };

  // ========================================================
  // ACTIVAR/DESACTIVAR USUARIO (ADMIN) (solo UI local)
  // ========================================================
  const adminToggleUser = (id) =>
    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
    );

  // ========================================================
  // ACTUALIZAR USUARIO
  // ========================================================
  const updateUsuario = async (id, datos) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return null;

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

    // si actualizaste al usuario logueado (incluye role), refresca localStorage
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
        esAdmin,

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
