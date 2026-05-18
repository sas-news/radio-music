import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import PlaylistDetail from './components/PlaylistDetail';
import AISelect from './components/AISelect';
import Settings from './components/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/playlist/:playlistId" element={<PlaylistDetail />} />
          <Route path="/ai-select" element={<AISelect />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
