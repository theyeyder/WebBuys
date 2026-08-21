import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar({ title = 'Dashboard' }) {
  const { user } = useAuth();
  return (
    <header className="topbar spatial-card">
      <div>
       
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="search-box"><Search size={17} /><input placeholder="Buscar clientes, pedidos o productos..." /></div>
        <button className="icon-btn"><Bell size={18} /></button>
        <div className="user-pill"><b>{user?.nombre}</b><span>{user?.rol}</span></div>
      </div>
    </header>
  );
}
