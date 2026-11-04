import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must be at least 8 characters with a letter and a number");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage("Password reset. Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-form-side" style={{ minHeight: "100vh" }}>
      <div className="auth-form">
        <div className="auth-logo">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.5l7 3v5c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9v-5l7-3z" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="brand-text">Wasaa<span className="life">Lifestyle</span></span>
        </div>

        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-sub">Choose a strong password you'll remember.</p>

        <form onSubmit={submit}>
          <input className="input" type="password" placeholder="New password"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
          <input className="input" type="password" placeholder="Confirm new password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }} disabled={saving}>
            {saving ? "Resetting..." : "Reset password"}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;