import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/Dashboard';
import MembershipRecords from './Pages/MembershipRecords';
import SalesRecord from './Pages/SalesRecord';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<MembershipRecords />} />
        <Route path="/sales" element={<SalesRecord />} />
      </Routes>
    </Router>
  );
}

export default App;