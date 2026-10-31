import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Brand() {
  return (
    <div className="brand-lockup">
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5l7 3v5c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9v-5l7-3z" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="brand-text">Wasaa<span className="life">Lifestyle</span></span>
    </div>
  );
}

function Search() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const runSearch = (categoryId) => {
    setLoading(true);
    const url = categoryId ? `/providers/search?category=${categoryId}` : "/providers/search";
    api.get(url)
      .then((res) => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { runSearch(""); }, []);

  const handleCategoryChange = (e) => {
    setSelected(e.target.value);
    runSearch(e.target.value);
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={() => navigate("/my-bookings")}>My bookings</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page">
        <h1 className="page-title">Find a provider you can trust</h1>
        <p className="lede">Every provider is ranked by a trust score built from real job history, not just star ratings.</p>

        <div style={{ marginBottom: 26 }}>
          <label className="label">Service</label>
          <select className="select" value={selected} onChange={handleCategoryChange} style={{ maxWidth: 260 }}>
            <option value="">All services</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="empty">No providers found for this service.</div>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              {providers.length} provider{providers.length !== 1 ? "s" : ""}, ranked by trust score
            </p>
            {providers.map((p, i) => (
              <div key={p.id} className="card clickable provider-card" onClick={() => navigate(`/provider/${p.id}`)}>
                <div className="rank">{i + 1}</div>
                <div className="pc-main">
                  <p className="pc-name">{p.name}</p>
                  <p className="pc-cat">{p.category}</p>
                  <div className="meta">
                    <span className={`badge ${p.verificationTier}`}>{p.verificationTier}</span>
                    <span className="sub">★ {p.avgRating} · {p.reviewCount} reviews</span>
                  </div>
                </div>
                <div className="score-box">
                  <div className="score-num">{p.trustScore}</div>
                  <div className="score-cap">trust score</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default Search;