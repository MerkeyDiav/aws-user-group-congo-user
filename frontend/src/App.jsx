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

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
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
