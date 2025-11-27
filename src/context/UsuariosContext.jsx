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
    const stored = localStorage.getItem("usuarioLogueado");
    return stored ? JSON.parse(stored) : null;
  });

  // guardamos TODAS las órdenes tal cual vienen de la BD
  const [ordenesAll, setOrdenesAll] = useState([]);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const esAdmin = (u) => String(u?.role || "").toLowerCase() === "admin";

  // ========================================================
  // CARGA INICIAL: trae usuarios + todas las órdenes
  // (igual que AdminUsuarios: el componente solo consume arrays del context)
  // ========================================================
  const refrescarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      const [resU, resO] = await Promise.all([
        fetch(`${API_URL}/usuarios`),
        fetch(`${API_URL}/ordenes`),
      ]);

      if (!resU.ok) throw new Error("Error al cargar usuarios");
      if (!resO.ok) throw new Error("Error al cargar órdenes");

      const dataU = await resU.json();
      const dataO = await resO.json();

      const listaUsuarios = Array.isArray(dataU) ? dataU : [];
      setUsuarios(listaUsuarios);

      setOrdenesAll(Array.isArray(dataO) ? dataO : []);

      // sincroniza role/nombre/etc del user logueado con lo que hay en la BD
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
          const changed = JSON.stringify(synced) !== JSON.stringify(usuarioLogueado);
          if (changed) {
            setUsuarioLogueado(synced);
            localStorage.setItem("usuarioLogueado", JSON.stringify(synced));
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error cargando datos");
      setUsuarios([]);
      setOrdenesAll([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    refrescarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================================
  // ÓRDENES “VISIBLES” SEGÚN SESIÓN
  // - admin: todas
  // - user: solo las suyas
  // - sin sesión: []
  // ========================================================
  const ordenes = useMemo(() => {
    if (!usuarioLogueado?.id) return [];
    if (esAdmin(usuarioLogueado)) return ordenesAll;

    const uid = String(usuarioLogueado.id);
    return (ordenesAll || []).filter((o) => String(o.usuarioId) === uid);
  }, [ordenesAll, usuarioLogueado?.id, usuarioLogueado?.role]);

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

    // opcional pero útil: refresca órdenes/usuarios
    refrescarDatos();

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

    // IMPORTANTÍSIMO: al loguear, recarga data (así admin ve todo)
    refrescarDatos();

    return publicUser;
  };

  const logout = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem("usuarioLogueado");
    // no borro ordenesAll; solo “ordenes visibles” quedarán [] por el memo,
    // pero si prefieres, también puedes limpiar:
    // setOrdenesAll([]);
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
    if (!usuarioLogueado?.id) throw new Error("No has iniciado sesión");

    const res = await fetch(`${API_URL}/ordenes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, usuarioId: usuarioLogueado.id }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al crear la orden");
    }

    const creada = await res.json();

    // la insertamos en ordenesAll para que admin y user la vean al toque
    setOrdenesAll((prev) => [creada, ...(prev || [])]);

    return creada;
  };

  // ==========================
  // CANCELAR ORDEN (DELETE /ordenes/:id) => backend setea estado=Cancelado
  // ==========================
  const cancelOrder = async (id) => {
    const res = await fetch(`${API_URL}/ordenes/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Error al cancelar orden");
    }

    const ordenActualizada = await res.json().catch(() => ({}));

    setOrdenesAll((prev) =>
      (prev || []).map((o) =>
        o.id === id
          ? (ordenActualizada?.id ? ordenActualizada : { ...o, estado: "Cancelado" })
          : o
      )
    );

    return ordenActualizada;
  };

  // ==========================
  // ACTIVAR/DESACTIVAR USUARIO (solo front)
  // ==========================
  const adminToggleUser = (id) =>
    setUsuarios((prev) =>
      (prev || []).map((u) => (u.id === id ? { ...u, activo: !u.activo } : u))
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
      (prev || []).map((u) => (u.id === actualizado.id ? actualizado : u))
    );

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
        ordenes,       // 👈 lo que consumen AdminDashboard/AdminOrdenes
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
        refrescarDatos, // por si quieres forzar recarga manual
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
}
