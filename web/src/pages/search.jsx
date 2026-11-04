import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlArea = searchParams.get("area") || "";
  const [areaInput, setAreaInput] = useState(urlArea);

  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState(urlCategory);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // load the category list once (for the dropdown)
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  const runSearch = (categoryId, areaVal) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (areaVal) params.set("area", areaVal);
    const qs = params.toString();
    api.get(`/providers/search${qs ? `?${qs}` : ""}`)
      .then((res) => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setSelected(urlCategory);
    runSearch(urlCategory, urlArea);
  }, [urlCategory, urlArea]);

  // run search on load AND whenever the URL category changes (e.g. arriving from the homepage)
  useEffect(() => {
    setSelected(urlCategory);
    runSearch(urlCategory);
  }, [urlCategory]);

  const handleCategoryChange = (e) => {
    setSelected(e.target.value);
    runSearch(e.target.value, areaInput.trim());
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/my-bookings")}>My bookings</button>
            <button onClick={() => navigate("/account")}>Account</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page">
        <h1 className="page-title">Find a provider you can trust</h1>
        <p className="lede">Every provider is ranked by a trust score built from real job history, not just star ratings.</p>

        <div style={{ display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="label">Service</label>
            <select className="select" value={selected} onChange={handleCategoryChange} style={{ minWidth: 200, marginBottom: 0 }}>
              <option value="">All services</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Area</label>
            <input className="input" placeholder="e.g. Westlands" value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(selected, areaInput.trim()); }}
              style={{ minWidth: 180, marginBottom: 0 }} />
          </div>
          <button className="btn btn-primary" style={{ padding: "12px 20px" }}
            onClick={() => runSearch(selected, areaInput.trim())}>Apply</button>
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
                <div className="avatar" style={{ width: 46, height: 46, minWidth: 46, fontSize: 16, flexShrink: 0 }}>
                  {p.photo
                    ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : (p.name ? p.name.split(" ").map(w => w[0]).slice(0,2).join("").toUpperCase() : "?")}
                </div>
                <div className="pc-main">
                  <p className="pc-name">{p.name}</p>
                  <p className="pc-cat">{p.category}</p>
                  <div className="meta">
                    <span className={`badge ${p.verificationTier}`}>{p.verificationTier}</span>
                    <span className="sub">{p.area ? `${p.area} · ` : ""}★ {p.avgRating} · {p.reviewCount} reviews</span>
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