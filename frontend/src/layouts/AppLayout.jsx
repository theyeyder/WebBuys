import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';


export default function AppLayout({ title, children }) {
  return (
    <main className="app-shell">
      <Sidebar />
      <section className="content-area">
        <Navbar title={title} />
        {children}
      </section>
    </main>
  );
}
