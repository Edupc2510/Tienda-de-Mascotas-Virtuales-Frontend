import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuarios } from "../context/UsuariosContext";
import "./CambiarPassword.css";

export default function CambiarPassword() {
  const { usuarioLogueado, cambiarPassword } = useUsuarios();
  const [passwords, setPasswords] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuarioLogueado) {
      alert("Primero inicia sesión 🐾");
      navigate("/login");
    }
  }, [usuarioLogueado, navigate]);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwords.actual || !passwords.nueva || !passwords.confirmar) {
      alert("Por favor completa todos los campos.");
      return;
    }

    if (passwords.nueva !== passwords.confirmar) {
      alert("Las contraseñas no coinciden ❌");
      return;
    }

    try {
      await cambiarPassword(usuarioLogueado.id, passwords.actual, passwords.nueva);
      alert("Contraseña cambiada correctamente 🔒");
      navigate("/mi-cuenta");
    } catch (err) {
      alert(err.message);
    }
  };

  if (!usuarioLogueado) return <p>Cargando...</p>;

  return (
    <section className="password-container">
      <div className="password-card">
        <h1>Cambiar Contraseña</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="actual"
            placeholder="Contraseña actual"
            value={passwords.actual}
            onChange={handleChange}
          />
          <input
            type="password"
            name="nueva"
            placeholder="Nueva contraseña"
            value={passwords.nueva}
            onChange={handleChange}
          />
          <input
            type="password"
            name="confirmar"
            placeholder="Confirmar nueva contraseña"
            value={passwords.confirmar}
            onChange={handleChange}
          />
          <div className="password-buttons">
            <button type="submit" className="guardar-btn">
              Guardar
            </button>
            <button
              type="button"
              className="cancelar-btn"
              onClick={() => navigate("/mi-cuenta")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
