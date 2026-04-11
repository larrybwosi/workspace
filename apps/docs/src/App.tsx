import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DocPage from './pages/DocPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user-guide/:slug" element={<DocPage type="user-guide" />} />
          <Route path="/api-reference/:slug" element={<DocPage type="api-reference" />} />
          <Route path="/user-guide" element={<DocPage type="user-guide" defaultSlug="joining-workspace" />} />
          <Route path="/api-reference" element={<DocPage type="api-reference" defaultSlug="authentication" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
