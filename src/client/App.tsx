import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from '@/client/pages/Home.js';
import AuthMock from '@/client/pages/AuthMock.js';
import { Layout } from '@/client/components/Layout.js';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/api/mocks/okta/oauth2/v1/authorize" element={<AuthMock />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
