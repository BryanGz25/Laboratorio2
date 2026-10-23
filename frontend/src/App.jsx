import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Vacio } from './components/Feedback';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NuevaOrden from './pages/NuevaOrden';
import Ordenes from './pages/Ordenes';
import Productos from './pages/Productos';

function NoEncontrada() {
  return <Vacio>Página no encontrada. <Link to="/">Volver al dashboard</Link></Vacio>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/nueva-orden" element={<NuevaOrden />} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
