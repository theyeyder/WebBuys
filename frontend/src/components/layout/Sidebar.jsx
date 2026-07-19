import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Tags, ShoppingCart, ReceiptText, UserCog, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/categorias', label: 'Categorías', icon: Tags },
  { to: '/productos', label: 'Productos', icon: Package },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { to: '/facturacion', label: 'Facturación', icon: ReceiptText },
  { to: '/empleados', label: 'Empleados', icon: UserCog, adminOnly: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings, adminOnly: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const visibleLinks = links.filter((link) => !link.adminOnly || user?.rol === 'Administrador');

  return (
    <aside className="sidebar spatial-card">
      <div className="brand-box">
        <div className="brand-mark">W</div>
        <div>
          <strong>WebBuys</strong>
          <span>Lácteos Del Tolima</span>
        </div>
      </div>
      <nav className="side-nav">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="logout-btn" onClick={logout}><LogOut size={18} /> Cerrar sesión</button>
    </aside>
  );
}
