import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Search from "./pages/Search";
import Provider from "./pages/Provider";
import MyBookings from "./pages/MyBookings";
import ProviderBookings from "./pages/ProviderBookings";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;