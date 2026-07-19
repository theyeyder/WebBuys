import { useNavigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";

export default function Configuracion() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Configuración">
      <section className="config-grid">
        <SpatialCard className="config-option">
          <span className="eyebrow">
            Configuración
          </span>

          <h2>Usuarios</h2>

          <p>
            Crea usuarios, asigna roles, bloquea accesos y
            restablece contraseñas.
          </p>

          <button
            className="primary-btn"
            type="button"
            onClick={() =>
              navigate("/configuracion/usuarios")
            }
          >
            Abrir usuarios
          </button>
        </SpatialCard>

        <SpatialCard className="config-option disabled">
          <span className="eyebrow">
            Próximamente
          </span>

          <h2>Empresa</h2>

          <p>
            Datos generales de la distribuidora,
            documentos e información comercial.
          </p>
        </SpatialCard>

        <SpatialCard className="config-option disabled">
          <span className="eyebrow">
            Próximamente
          </span>

          <h2>Preferencias</h2>

          <p>
            Parámetros generales del sistema y
            comportamiento de WebBuys.
          </p>
        </SpatialCard>
      </section>
    </AppLayout>
  );
}