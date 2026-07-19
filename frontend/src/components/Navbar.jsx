import { Bell, LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  return (
    <header className="navbar">
      <div className="search-pill">
        <Search size={18} />
        <input placeholder="Buscar cliente, pedido o producto..." />
      </div>
      <div className="nav-actions">
        <button className="icon-btn" type="button"><Bell size={18} /></button>
        <div className="user-chip">
          <span>{usuario?.nombre || usuario?.usuario}</span>
          <small>{usuario?.rol}</small>
        </div>
        <button className="logout-btn" onClick={logout}><LogOut size={17} /> Salir</button>
      </div>
    </header>
  );
}
