import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuarios } from "../context/UsuariosContext";
import "./forgotPassword.css";

export default function ForgotPassword() {
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { usuarios, updateUsuario } = useUsuarios(); // usamos todos los usuarios y la función update

  const validarCorreo = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

  const generarPasswordRandom = (length = 8) => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!correo) {
      setError("Por favor, ingresa tu correo electrónico.");
      return;
    }

    if (!validarCorreo(correo)) {
      setError("Por favor, ingresa un correo válido.");
      return;
    }

    const usuario = usuarios.find(
      (u) => u.email.toLowerCase() === correo.toLowerCase()
    );

    if (!usuario) {
      setError("No existe una cuenta asociada a este correo.");
      return;
    }

    // Generar nueva contraseña
    const nuevaPassword = generarPasswordRandom();
    console.log("Nueva contraseña generada (Utilizar para ingresar):", nuevaPassword);

    try {
      await updateUsuario(usuario.id, { password: nuevaPassword });
      setMensaje(
        "Se ha enviado una nueva contraseña a tu correo. 📧"
      );

      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } catch (err) {
      console.error(err);
      setError("Hubo un error al restablecer la contraseña.");
    }
  };

  return (
    <section className="forgot-container">
      <div className="forgot-card">
        <h1 className="forgot-title">¿Olvidaste tu contraseña?</h1>
        <p className="forgot-subtitle">
          No te preocupes, te ayudaremos a recuperarla 🐾
        </p>

        <form onSubmit={handleSubmit} className="forgot-form">
          {error && <p className="error-message">{error}</p>}
          {mensaje && <p className="success-message">{mensaje}</p>}

          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={error ? "input-error" : ""}
          />

          <button type="submit" className="forgot-btn">
            Restablecer contraseña
          </button>
        </form>

        <div className="forgot-links">
          <a href="/login">Volver al inicio de sesión</a>
        </div>
      </div>
    </section>
  );
}
