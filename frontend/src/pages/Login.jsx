import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({
    usuario: "",
    password: "",
  });

  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setError("");

      await login(form);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Usuario o contraseña incorrectos"
      );
    }
  };

  return (
    <main className="login-page spatial-bg">
      <div className="floating-orb orb-one" />
      <div className="floating-orb orb-two" />

      <motion.section
        className="login-hero"
        initial={{ opacity: 0, x: -45, rotateY: -8 }}
        animate={{ opacity: 1, x: 0, rotateY: 0 }}
        transition={{ duration: 0.8 }}
        whileHover={{
          rotateX: 2,
          rotateY: -4,
          scale: 1.01,
        }}
      >
        <div className="hero-glow" />

        <motion.img
          src="/Login.webp"
          alt="WebBuys"
          className="login-hero-image"
          whileHover={{ scale: 1.06 }}
          transition={{ duration: 0.7 }}
        />

        <div className="hero-shine" />
      </motion.section>

      <motion.form
        className="login-card spatial-card"
        onSubmit={handleSubmit}
        autoComplete="off"
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="login-tag">
          <center>ACCESO A WEBBUYS</center>
        </span>

        <center>
          <h1>Iniciar sesión</h1>
        </center>

        <p>Ingresa tus credenciales para acceder al sistema.</p>

        {error && <div className="error">{error}</div>}

        <label>
          <center>Usuario</center>
        </label>

        <input
          type="text"
          name="usuario"
          autoComplete="off"
          spellCheck="false"
          value={form.usuario}
          onChange={(e) =>
            setForm({
              ...form,
              usuario: e.target.value,
            })
          }
          placeholder="Digite su Usuario"
        />

        <label>
          <center>Contraseña</center>
        </label>

        <input
          type="password"
          name="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value,
            })
          }
          placeholder="Escribir Contraseña"
        />

        <button
          className="primary-btn"
          type="submit"
        >
          Iniciar
          <ArrowRight size={18} />
        </button>
      </motion.form>
    </main>
  );
}