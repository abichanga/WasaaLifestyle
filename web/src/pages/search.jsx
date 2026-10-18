import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Search() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState("");   // selected category id ("" = all)
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // load the list of categories once, for the dropdown
  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  // fetch providers (optionally filtered by category)
  const runSearch = (categoryId) => {
    setLoading(true);
    const url = categoryId ? `/providers/search?category=${categoryId}` : "/providers/search";
    api.get(url)
      .then((res) => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  };

  // load all providers on first open
  useEffect(() => { runSearch(""); }, []);

  const handleCategoryChange = (e) => {
    const id = e.target.value;
    setSelected(id);
    runSearch(id);
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Find a trusted provider</h1>
        <button onClick={() => navigate("/my-bookings")} style={{ marginBottom: 12 }}>My Bookings</button>
        <button onClick={logout}>Log out</button>
      </div>

      <div style={{ margin: "16px 0" }}>
        <label style={{ marginRight: 8 }}>Service:</label>
        <select value={selected} onChange={handleCategoryChange} style={{ padding: 8, minWidth: 200 }}>
          <option value="">All services</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      <p style={{ color: "#666" }}>Ranked by trust score</p>

      {loading ? (
        <p>Loading...</p>
      ) : providers.length === 0 ? (
        <p>No providers found for this service.</p>
      ) : (
        providers.map((p) => (
          <div key={p.id}
            onClick={() => navigate(`/provider/${p.id}`)}
            style={{
              border: "1px solid #ddd", borderRadius: 8, padding: 16,
              marginBottom: 12, cursor: "pointer",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong style={{ fontSize: 18 }}>{p.name}</strong>
                <div style={{ color: "#666" }}>{p.category}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Tier: {p.verificationTier} · {p.reviewCount} reviews · ⭐ {p.avgRating}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: "bold", color: "#2a9d8f" }}>
                  {p.trustScore}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>trust score</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Search;