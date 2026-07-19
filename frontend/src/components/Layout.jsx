import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Navbar />
        <section className="page-content">{children}</section>
      </main>
    </div>
  );
}
