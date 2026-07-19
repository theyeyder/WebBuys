import AppLayout from '../layouts/AppLayout.jsx';
import SpatialCard from '../components/cards/SpatialCard.jsx';

const pedidos = [
  { cliente: 'Tienda La 42', producto: 'Queso campesino x 500g', estado: 'En ruta', total: '$245.000' },
  { cliente: 'Restaurante El Portal', producto: 'Quesillo doble crema', estado: 'Pendiente', total: '$380.000' },
  { cliente: 'Supermercado Centro', producto: 'Yogurt surtido', estado: 'Entregado', total: '$610.000' },
];

export default function Dashboard() {
  return (
    <AppLayout title="Dashboard">
      <section className="dashboard-intro">
        <span className="eyebrow">Estadísticas</span>
        <h2>Ventas, Facturas y Pedidos</h2>
        <p>Resumen de las actividades del negocio.</p>
      </section>
      <section className="bento-grid">
        <SpatialCard className="metric green span-2"><span>Ventas del día</span><strong>$1.235.000</strong><small>+18% frente a ayer</small></SpatialCard>
        <SpatialCard className="metric"><span>Pedidos hoy</span><strong>24</strong><small>6 pendientes</small></SpatialCard>
        <SpatialCard className="metric dark"><span>Clientes activos</span><strong>148</strong><small>Ibagué y alrededores</small></SpatialCard>
        <SpatialCard className="orders span-2 tall">
          <div className="card-head"><h3>Pedidos recientes</h3><button>+ Nuevo</button></div>
          {pedidos.map((p) => <article key={p.cliente}><div><b>{p.cliente}</b><span>{p.producto}</span></div><em>{p.estado}</em><strong>{p.total}</strong></article>)}
        </SpatialCard>
        <SpatialCard className="metric"><span>Stock bajo</span><strong>7</strong><small>Productos por revisar</small></SpatialCard>
        <SpatialCard className="metric"><span>Facturas</span><strong>18</strong><small>Generadas hoy</small></SpatialCard>
        <SpatialCard className="chart span-2"><div className="card-head"><h3>Flujo semanal</h3><span className="pill">Demo UI</span></div><div className="bars"><i /><i /><i /><i /><i /><i /><i /></div></SpatialCard>
      </section>
    </AppLayout>
  );
}
