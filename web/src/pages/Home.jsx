import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Brand() {
  return (
    <div className="lock">
      <span className="mark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5l7 3v5c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9v-5l7-3z" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="wordmark">Wasaa<span className="l">Lifestyle</span></span>
    </div>
  );
}

function CategoryIcon({ name }) {
  const n = (name || "").toLowerCase();
  const common = { viewBox: "0 0 24 24", fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  if (n.includes("plumb"))
    return <svg {...common}><path d="M14.5 3.5l2 2-3 3 2 2 3-3 2 2a5 5 0 01-6.5 6.5L8 22l-3-3 4.5-5.5A5 5 0 0116 6l-1.5-1.5z"/></svg>;
  if (n.includes("elect"))
    return <svg {...common}><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></svg>;
  if (n.includes("carp"))
    return <svg {...common}><path d="M3 17l9-9m0 0l2.5-2.5a2 2 0 012.8 0l1.2 1.2a2 2 0 010 2.8L16 12m-4-4l4 4m-9 5l-3 3m3-3l3 3"/></svg>;
  return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/><circle cx="8" cy="6" r="1"/><circle cx="8" cy="15" r="2.5"/></svg>;
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Home() {
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [counts, setCounts] = useState({});
  const [selected, setSelected] = useState("");
  const [area, setArea] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/categories").then((res) => setCategories(res.data)).catch(() => {});
    api.get("/providers/search").then((res) => {
      setProviders(res.data);
      const c = {};
      res.data.forEach((p) => { c[p.category] = (c[p.category] || 0) + 1; });
      setCounts(c);
    }).catch(() => {});
  }, []);

  const topProviders = providers.slice(0, 3);

  const goSearch = () => {
    const params = new URLSearchParams();
    if (selected) params.set("category", selected);
    if (area.trim()) params.set("area", area.trim());
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : "/search");
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };
  const loggedIn = !!localStorage.getItem("token");

  return (
    <>
      <nav className="nav">
        <div className="nav-in">
          <Brand />
          <nav className="nav-links">
            <a onClick={() => navigate("/search")} style={{ cursor: "pointer" }}>Browse</a>
            {loggedIn && <a onClick={() => navigate("/my-bookings")} style={{ cursor: "pointer" }}>My bookings</a>}
            {loggedIn && <a onClick={() => navigate("/account")}>Account</a>}
            {loggedIn
              ? <a className="cta" onClick={logout} style={{ cursor: "pointer" }}>Log out</a>
              : <a className="cta" onClick={() => navigate("/login")} style={{ cursor: "pointer" }}>Sign in</a>}
          </nav>
        </div>
      </nav>

      <div className="hero">
        <div className="hero-in">
          <div className="hero-copy">
            <span className="tag" style={{ marginBottom: 22, display: "inline-block" }}>Kenya's first trust-scored marketplace</span>
            <h1>Hire household technicians you can <span className="hl">actually trust</span></h1>
            <p>Verified plumbers, electricians and carpenters in Nairobi, ranked by a trust score built from real job history, not just star ratings.</p>
            <div className="searchbar">
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                <option value="">All services</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input placeholder="Area (e.g. Kilimani, Westlands)" value={area} onChange={(e) => setArea(e.target.value)} />
              <button className="go" onClick={goSearch}>Find providers</button>
            </div>
          </div>

          <div className="hero-visual">
            <img src="/hero.png" alt="Verified household technician" />
            <div className="photo-badge">
              <span className="pb-score">94</span>
              <span className="pb-text"><strong>Trusted provider</strong>Verified &amp; track-record earned</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <p className="eyebrow">How trust is earned</p>
        <h2 className="sec-title">Three layers, one score</h2>
        <p className="sec-sub">Every provider builds trust through the same transparent process, so you know who you're letting into your home.</p>
        <div className="steps">
          <div className="step">
            <div className="n">1</div><h3>Identity verified</h3>
            <p>National ID confirmed, so you know exactly who is turning up at your door.</p>
            <span className="arrow">→</span>
          </div>
          <div className="step">
            <div className="n">2</div><h3>Credential verified</h3>
            <p>Trade certification or association membership checked for skilled work.</p>
            <span className="arrow">→</span>
          </div>
          <div className="step">
            <div className="n">3</div><h3>Track record earned</h3>
            <p>Trust grows with every completed job and honest review over time.</p>
          </div>
        </div>
      </section>

      <section>
        <p className="eyebrow">Browse by trade</p>
        <h2 className="sec-title">What do you need done?</h2>
        <div className="cats">
          {categories.map((c) => (
            <div className="cat" key={c._id} onClick={() => navigate(`/search?category=${c._id}`)}>
              <div className="ico"><CategoryIcon name={c.name} /></div>
              <div className="name">{c.name}</div>
              <div className="meta">{counts[c.name] || 0} providers</div>
            </div>
          ))}
        </div>
      </section>

      <div className="feat">
        <div className="feat-in">
          <p className="eyebrow">Top rated</p>
          <h2 className="sec-title">Highest trust scores</h2>
          <p className="sec-sub">These providers lead the rankings on real reliability, not just reviews.</p>
          <div className="pcards">
            {topProviders.map((p) => (
              <div className="pcard" key={p.id} onClick={() => navigate(`/provider/${p.id}`)}>
                <div className="pcard-top">
                  <div className="avatar">
                    {p.photo
                      ? <img src={p.photo} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      : initials(p.name)}
                  </div>
                  <div><div className="pn">{p.name}</div><div className="pc">{p.category}{p.area ? ` · ${p.area}` : ""}</div></div>
                </div>
                <div className="pcard-bottom">
                  <span className={`badge ${p.verificationTier}`}>● {p.verificationTier}</span>
                  <div className="ts"><div className="n">{p.trustScore}</div><div className="c">trust score</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;