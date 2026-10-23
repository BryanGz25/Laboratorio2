import { NavLink, Outlet } from 'react-router-dom';

const ENLACES = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/productos', label: 'Productos' },
  { to: '/ordenes', label: 'Órdenes' },
  { to: '/nueva-orden', label: 'Nueva orden' },
];

export default function Layout() {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__logo" aria-hidden="true">TO</span>
            Tienda Online
          </NavLink>
          <nav className="nav" aria-label="Principal">
            {ENLACES.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
