import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Pages/Dashboard';
import MembershipRecords from './Pages/MembershipRecords';
import SalesRecord from './Pages/SalesRecord';
import LoginPage from './Pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<LoginPage/>}/>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<MembershipRecords />} />
        <Route path="/sales" element={<SalesRecord />} />
      </Routes>
    </Router>
  );
}

export default App;