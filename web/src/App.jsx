import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Search from "./pages/Search";
import Provider from "./pages/Provider";
import MyBookings from "./pages/MyBookings";
import ProviderBookings from "./pages/ProviderBookings";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/search" element={<Search />} />
        <Route path="/provider/:id" element={<Provider />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-jobs" element={<ProviderBookings />} />
        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/verify" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;