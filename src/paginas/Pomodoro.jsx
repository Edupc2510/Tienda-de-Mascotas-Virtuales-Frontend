// src/paginas/Pomodoro.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUsuarios } from "../context/UsuariosContext";
import "./Pomodoro.css";
import sonidoFinal from "/sound/alarm.mp3";

export default function Pomodoro() {
  const { usuarioLogueado, ordenes } = useUsuarios();

  const [mode, setMode] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const timerRef = useRef(null);

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);

  const FOCUS_TIME = 25 * 60;
  const SHORT_BREAK = 5 * 60;
  const LONG_BREAK = 15 * 60;

  // Audio (crearlo una vez)
  const audioRef = useRef(null);
  useEffect(() => {
    audioRef.current = new Audio(sonidoFinal);
  }, []);

  // 🚀 Timer
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            audioRef.current?.play?.();
            handleSessionEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode, cycleCount]);

  const handleSessionEnd = () => {
    if (mode === "focus") {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      if (nextCycle % 4 === 0) {
        setMode("long");
        setTimeLeft(LONG_BREAK);
      } else {
        setMode("short");
        setTimeLeft(SHORT_BREAK);
      }
      setAutoCycle(true);
    } else {
      if (autoCycle) {
        setMode("focus");
        setTimeLeft(FOCUS_TIME);
        if (mode === "long") setCycleCount(0);
      } else {
        if (mode === "short") setTimeLeft(SHORT_BREAK);
        if (mode === "long") setTimeLeft(LONG_BREAK);
        setIsRunning(false);
      }
    }
  };

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setCycleCount(0);
    if (mode === "focus") setTimeLeft(FOCUS_TIME);
    if (mode === "short") setTimeLeft(SHORT_BREAK);
    if (mode === "long") setTimeLeft(LONG_BREAK);
  };

  const switchMode = (newMode) => {
    clearInterval(timerRef.current);
    setIsRunning(false);
    setMode(newMode);
    setAutoCycle(false);
    setCycleCount(newMode === "focus" ? cycleCount : 0);
    if (newMode === "focus") setTimeLeft(FOCUS_TIME);
    if (newMode === "short") setTimeLeft(SHORT_BREAK);
    if (newMode === "long") setTimeLeft(LONG_BREAK);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Mascotas activas (de órdenes PENDIENTES, no canceladas)
  const mascotasActivas = useMemo(() => {
    if (!usuarioLogueado || !Array.isArray(ordenes)) return [];

    const pendientes = ordenes.filter((o) => {
      const estado = String(o.estado ?? "").toLowerCase().trim();
      return o.usuarioId === usuarioLogueado.id && estado === "pendiente";
    });

    const map = new Map(); // id -> producto

    for (const o of pendientes) {
      // 1) Preferir detalle (trae producto completo si el backend lo incluye)
      if (Array.isArray(o.detalle) && o.detalle.length > 0) {
        for (const d of o.detalle) {
          const p = d?.producto;
          if (!p) continue;

          // Si existe "activo", filtramos; si no existe, lo dejamos pasar
          const activoOk =
            p.activo === undefined || p.activo === null ? true : !!p.activo;
          if (!activoOk) continue;

          const id = p.id;
          if (!id) continue;

          if (!map.has(id)) map.set(id, p);
        }
        continue;
      }

      // 2) Fallback a items (si por alguna razón detalle no viene)
      if (Array.isArray(o.items) && o.items.length > 0) {
        for (const it of o.items) {
          const id = it?.id ?? it?.productoId;
          if (!id) continue;

          const productoLike = {
            id,
            nombre: it?.nombre ?? `Producto #${id}`,
            imagenUrl: it?.imagenUrl ?? it?.imagen ?? it?.image ?? null,
            imagenUrlCartoon: it?.imagenUrlCartoon ?? null,
            activo:
              it?.activo === undefined || it?.activo === null
                ? true
                : !!it.activo,
          };

          if (!productoLike.activo) continue;
          if (!map.has(id)) map.set(id, productoLike);
        }
      }
    }

    return Array.from(map.values());
  }, [usuarioLogueado, ordenes]);

  // ✅ Selección por defecto (sin setState dentro de useMemo)
  useEffect(() => {
    if (!mascotaSeleccionada && mascotasActivas.length > 0) {
      setMascotaSeleccionada(mascotasActivas[0]);
    } else if (
      mascotaSeleccionada &&
      mascotasActivas.length > 0 &&
      !mascotasActivas.some((m) => m.id === mascotaSeleccionada.id)
    ) {
      setMascotaSeleccionada(mascotasActivas[0]);
    } else if (mascotasActivas.length === 0) {
      setMascotaSeleccionada(null);
    }
  }, [mascotasActivas, mascotaSeleccionada]);

  const mosaico = useMemo(() => {
    if (!mascotaSeleccionada) return null;

    const tiles = [];
    const columnas = 10;
    const filas = 6;
    const espaciadoX = 8;
    const espaciadoY = 10;

    const imagen =
      mascotaSeleccionada.imagenUrlCartoon || mascotaSeleccionada.imagenUrl;

    for (let y = 0; y < filas; y++) {
      for (let x = 0; x < columnas; x++) {
        const rotacion = Math.floor(Math.random() * 360);

        tiles.push(
          <img
            key={`${x}-${y}`}
            src={imagen}
            alt={mascotaSeleccionada.nombre ?? "Mascota"}
            className="tile"
            style={{
              top: `${(y * 100) / filas + y * espaciadoY}%`,
              left: `${(x * 100) / columnas + x * espaciadoX}%`,
              transform: `rotate(${rotacion}deg)`,
            }}
          />
        );
      }
    }

    return tiles;
  }, [mascotaSeleccionada]);

  if (!usuarioLogueado) {
    return (
      <div className="pomodoro-loading">
        🐶 Inicia sesión para ver tus mascotas...
      </div>
    );
  }

  const sinMascotas = mascotasActivas.length === 0;

  return (
    <div className="pomodoro-root">
      {mascotaSeleccionada && <div className="mosaic-bg">{mosaico}</div>}

      <div className="pomodoro-container">
        <h1 className="pomodoro-title">¿En qué te quieres concentrar?</h1>

        {sinMascotas && (
          <p style={{ marginTop: 8, opacity: 0.9 }}>
            No tienes mascotas disponibles (necesitas una orden <b>Pendiente</b>).
          </p>
        )}

        <div className="mode-buttons">
          <div className="focus-section">
            <button
              className={`mode-btn ${mode === "focus" ? "active" : ""}`}
              onClick={() => switchMode("focus")}
            >
              Focus
            </button>
            <div className="cycle-indicator">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`cycle-dot ${cycleCount >= i ? "filled" : ""}`}
                ></span>
              ))}
            </div>
          </div>

          <button
            className={`mode-btn ${mode === "short" ? "active" : ""}`}
            onClick={() => switchMode("short")}
          >
            Short Break
          </button>
          <button
            className={`mode-btn ${mode === "long" ? "active" : ""}`}
            onClick={() => switchMode("long")}
          >
            Long Break
          </button>
        </div>

        <div className="timer-display">{formatTime(timeLeft)}</div>

        <div className="pomodoro-controls">
          {!isRunning ? (
            <button className="btn start-btn" onClick={startTimer}>
              Start
            </button>
          ) : (
            <button className="btn start-btn" onClick={pauseTimer}>
              Pause
            </button>
          )}
          <button className="btn reset-btn" onClick={resetTimer}>
            ⟳
          </button>
        </div>
      </div>

      {/* selector */}
      <button
        className="boton-patita"
        onClick={() => setMenuAbierto(!menuAbierto)}
        disabled={sinMascotas}
        title={sinMascotas ? "No hay mascotas disponibles" : "Elegir mascota"}
        style={sinMascotas ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        🐾
      </button>

      <div className={`menu-mascotas ${menuAbierto ? "abierto" : ""}`}>
        <h3>Elige tu mascota</h3>
        <ul>
          {mascotasActivas.map((m) => (
            <li
              key={m.id}
              onClick={() => {
                setMascotaSeleccionada(m);
                setMenuAbierto(false);
              }}
            >
              <img
                src={m.imagenUrlCartoon || m.imagenUrl}
                alt={m.nombre ?? "Mascota"}
              />
              <span>{m.nombre ?? `Producto #${m.id}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
