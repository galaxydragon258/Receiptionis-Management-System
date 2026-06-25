import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/Dashboard';
import MembershipRecords from './Pages/MembershipRecords';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<MembershipRecords />} />
      </Routes>
    </Router>
  );
}

export default App;