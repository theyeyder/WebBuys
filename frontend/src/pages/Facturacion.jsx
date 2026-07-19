import AppLayout from '../layouts/AppLayout.jsx';
import SpatialCard from '../components/cards/SpatialCard.jsx';

export default function Facturacion() {
  return (
    <AppLayout title="Facturacion">
      <SpatialCard className="empty-module">
        <span className="eyebrow">Módulo WebBuys</span>
        <h2>Facturacion</h2>
        <p>Este módulo queda preparado para construir CRUD, filtros, modales y conexión con MongoDB.</p>
        <button className="primary-btn">+ Nuevo registro</button>
      </SpatialCard>
    </AppLayout>
  );
}
