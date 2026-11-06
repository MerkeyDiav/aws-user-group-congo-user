import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Events from './pages/Events.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Contact from './pages/Contact.jsx';
import Join from './pages/Join.jsx';
import Speakers from './pages/Speakers.jsx';
import NotFound from './pages/NotFound.jsx';
import { ContentProvider } from './hooks/useResource.js';

// L'espace admin est chargé à part : les visiteurs du site ne téléchargent jamais son code.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<div className="boot"><span className="spinner spinner--dark" /></div>}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route
        element={
          <ContentProvider>
            <Layout />
          </ContentProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="a-propos" element={<About />} />
        <Route path="evenements" element={<Events />} />
        <Route path="evenements/:id" element={<EventDetail />} />
        <Route path="contact" element={<Contact />} />
        <Route path="rejoindre" element={<Join />} />
        <Route path="speakers" element={<Speakers />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
