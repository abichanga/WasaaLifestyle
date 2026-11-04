import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", password: "", role: "household",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await api.post("/auth/register", form);
      }
      const res = await api.post("/auth/login", {
        email: form.email, password: form.password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      const role = res.data.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "provider") navigate("/my-jobs");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      {/* left: branded panel with floating trust-score cards */}
      <div className="auth-panel">
        <div className="float-cards">
          <div className="float-card fc1"><div className="fc-score">96</div><div className="fc-label">trust score</div></div>
          <div className="float-card fc2"><div className="fc-score">88</div><div className="fc-label">trust score</div></div>
          <div className="float-card fc3"><div className="fc-score">79</div><div className="fc-label">trust score</div></div>
        </div>
        <h2 className="panel-head">Trust, before you even meet them.</h2>
        <p className="panel-sub">
          Find verified household service providers in Nairobi, ranked by a trust score built from real job history.
        </p>
      </div>

      {/* right: the form */}
      <div className="auth-form-side">
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

          <h1 className="auth-title">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="auth-sub">{isRegister ? "Join to find trusted help." : "Sign in to continue."}</p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <input className="input" name="fullName" placeholder="Full name"
                  value={form.fullName} onChange={handleChange} required />
                <input className="input" name="phone" placeholder="Phone number"
                  value={form.phone} onChange={handleChange} required />
              </>
            )}
            <input className="input" name="email" type="email" placeholder="Email address"
              value={form.email} onChange={handleChange} required />
            <input className="input" name="password" type="password" placeholder="Password"
              value={form.password} onChange={handleChange} required />

            {isRegister && (
              <select className="select" name="role" value={form.role} onChange={handleChange}>
                <option value="household">I need a service (Household)</option>
                <option value="provider">I provide a service (Provider)</option>
              </select>
            )}

            <button className="btn btn-primary" type="submit" style={{ width: "100%", marginTop: 4 }} disabled={loading}>
              {loading ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          {error && <p className="error-msg">{error}</p>}

          <p className="muted" style={{ marginTop: 18, textAlign: "center" }}>
            {isRegister ? "Already have an account? " : "No account yet? "}
            <button onClick={() => setIsRegister(!isRegister)}
              style={{ border: "none", background: "none", color: "var(--teal)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              {isRegister ? "Sign in" : "Register"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;