import SpatialCard from './SpatialCard';

export default function CrudPage({ title, subtitle, columns = ['Nombre', 'Estado', 'Acciones'] }) {
  return (
    <div>
      <div className="page-title compact-title">
        <span>Gestión WebBuys</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <SpatialCard className="table-card">
        <div className="toolbar">
          <input placeholder={`Buscar en ${title.toLowerCase()}...`} />
          <button className="primary-btn">+ Nuevo</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td>Registro de ejemplo</td>
                <td><span className="status-pill">Activo</span></td>
                <td><button className="ghost-btn">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </SpatialCard>
    </div>
  );
}
