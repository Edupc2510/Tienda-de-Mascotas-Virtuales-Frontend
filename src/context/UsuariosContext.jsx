// src/context/UsuariosContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const UsuariosContext = createContext();

export const useUsuarios = () => {
  const ctx = useContext(UsuariosContext);
  if (!ctx) throw new Error("useUsuarios debe usarse dentro de UsuariosProvider");
  return ctx;
};

const API_URL = "http://localhost:5000";

export function UsuariosProvider({ children }) {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    const stored = localStorage.getItem('usuarioLogueado');
    return stored ? JSON.parse(stored) : null;
  });
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar usuarios y órdenes
  useEffect(() => {
    const fetchInicial = async () => {
      try {
        setCargando(true);
        setError(null);

        const resU = await fetch(`${API_URL}/usuarios`);
        if (!resU.ok) throw new Error("Error al cargar usuarios");
        const dataU = await resU.json();
        setUsuarios(dataU || []);

        const resO = await fetch(`${API_URL}/ordenes`);
        if (!resO.ok) throw new Error("Error al cargar órdenes");
        const dataO = await resO.json();
        setOrdenes(dataO || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    fetchInicial();
  }, []);

  // ==========================
  // REGISTRO
  // ==========================
  const register = async ({ nombre = "", apellido = "", email, password }) => {
    if (!email || !password) throw new Error("Faltan datos");

    const exists = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error("Ya existe un usuario con ese correo");

    const nuevoUsuario = { nombre, apellido, email, password, role: "user", activo: true };

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
    setUsuarios(prev => [...prev, creado]);

    const publicUser = {
      id: creado.id,
      nombre: creado.nombre,
      apellido: creado.apellido,
      email: creado.email,
      role: creado.role,
    };

    setUsuarioLogueado(publicUser);
    localStorage.setItem('usuarioLogueado', JSON.stringify(publicUser));
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
    localStorage.setItem('usuarioLogueado', JSON.stringify(publicUser));
    return publicUser;
  };

  const logout = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('usuarioLogueado');
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

  // ==========================
  // ACTUALIZAR USUARIO
  // ==========================
  const updateUsuario = async (id, datos) => {
    const usuario = usuarios.find(u => u.id === id);
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
    setUsuarios(prev => prev.map(u => (u.id === actualizado.id ? actualizado : u)));

    if (usuarioLogueado?.id === id) {
      const updatedLogueado = {
        ...usuarioLogueado,
        nombre: actualizado.nombre,
        apellido: actualizado.apellido,
        email: actualizado.email,
      };
      setUsuarioLogueado(updatedLogueado);
      localStorage.setItem('usuarioLogueado', JSON.stringify(updatedLogueado));
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
        updateUsuario,
      }}
    >
      {children}
    </UsuariosContext.Provider>
  );
}
