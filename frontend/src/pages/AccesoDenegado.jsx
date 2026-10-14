import { useAuth } from "../context/AuthContext.jsx";

export default function AccesoDenegado() {
  const { logout } = useAuth();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f4f7f5",
      }}
    >
      <section
        style={{
          width: "min(520px, 100%)",
          padding: "28px",
          border: "1px solid #d8e0dc",
          borderRadius: "16px",
          background: "#ffffff",
          boxShadow: "0 14px 35px rgba(15, 23, 42, 0.10)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Sin módulos asignados</h1>
        <p style={{ color: "#5f6b65", lineHeight: 1.6 }}>
          Tu usuario no tiene módulos habilitados en este momento.
          Solicita al administrador que te asigne un perfil o permisos.
        </p>

        <button
          type="button"
          onClick={logout}
          style={{
            marginTop: "12px",
            minHeight: "40px",
            padding: "0 18px",
            border: 0,
            borderRadius: "9px",
            background: "#176b4b",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </section>
    </main>
  );
}
