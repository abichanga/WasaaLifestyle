import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Search from "./pages/search";
import Provider from "./pages/Provider";
import MyBookings from "./pages/MyBookings";
import ProviderBookings from "./pages/ProviderBookings";
import Admin from "./pages/Admin";
import Verify from "./pages/Verify";
import Home from "./pages/Home";
import EditProfile from "./pages/EditProfile";
import Account from "./pages/Account";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

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
        <Route path="/" element={<Home />} />
        <Route path="/edit-profile" element={<EditProfile />} />  
        <Route path="/account" element={<Account />} />    
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;