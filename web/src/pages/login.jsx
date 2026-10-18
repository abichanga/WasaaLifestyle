import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "household",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        // register, then log in
        await api.post("/auth/register", form);
      }
      // log in
      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });
      // save the token and user
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
  
      // route by role
      const role = res.data.user.role;
      navigate(role === "provider" ? "/my-jobs" : "/search");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>WasaaLifestyle</h1>
      <h2>{isRegister ? "Create account" : "Sign in"}</h2>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <>
            <input name="fullName" placeholder="Full name" value={form.fullName}
              onChange={handleChange} required
              style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
            <input name="phone" placeholder="Phone" value={form.phone}
              onChange={handleChange} required
              style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
          </>
        )}
        <input name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} required
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />
        <input name="password" type="password" placeholder="Password" value={form.password}
          onChange={handleChange} required
          style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }} />

        {isRegister && (
          <select name="role" value={form.role} onChange={handleChange}
            style={{ display: "block", width: "100%", marginBottom: 8, padding: 8 }}>
            <option value="household">Household</option>
            <option value="provider">Provider</option>
          </select>
        )}

        <button type="submit" style={{ width: "100%", padding: 10, marginTop: 8 }}>
          {isRegister ? "Register" : "Sign in"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p style={{ marginTop: 16 }}>
        {isRegister ? "Already have an account?" : "No account?"}{" "}
        <button onClick={() => setIsRegister(!isRegister)}
          style={{ border: "none", background: "none", color: "blue", cursor: "pointer" }}>
          {isRegister ? "Sign in" : "Register"}
        </button>
      </p>
    </div>
  );
}

export default Login;