import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function Provider() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ scheduledDate: "", scheduledTime: "", address: "", notes: "" });
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/providers/${id}`).then((res) => setProvider(res.data)).catch(() => {});
    api.get(`/reviews/provider/${id}`).then((res) => setReviews(res.data)).catch(() => {});
  }, [id]);

  const book = async (e) => {
    e.preventDefault();
    setMessage("");
    setBooking(true);
    try {
      await api.post("/bookings", { providerId: id, ...form });
      setMessage("Booking requested. The provider will confirm shortly.");
      setShowForm(false);
      setForm({ scheduledDate: "", scheduledTime: "", address: "", notes: "" });
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  if (!provider) return <div className="loading">Loading...</div>;

  const ts = provider.trustScore?.value ?? 0;
  const bd = provider.breakdown || {};
  const signals = [
    { label: "Job completion", value: bd.completion || 0 },
    { label: "Low complaints", value: bd.lowComplaints || 0 },
    { label: "Customer rating", value: bd.rating || 0 },
    { label: "Verification", value: bd.verification || 0 },
  ];
  const maxPts = Math.max(...signals.map((s) => s.value), 1);
  const fullName = provider.userId?.fullName || "Provider";

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 24, padding: "8px 16px" }}
        onClick={() => navigate("/search")}>← Back to search</button>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* header */}
        <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 16 }}>
            <div className="avatar" style={{ width: 60, height: 60, fontSize: 22 }}>
              {provider.photo
                ? <img src={provider.photo} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : fullName[0]}
            </div>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, margin: "0 0 6px" }}>
                {fullName}
              </h1>
              <div className="meta">
                <span className={`badge ${provider.verificationTier}`}>{provider.verificationTier}</span>
                <span className="sub">
                  {provider.serviceCategoryId?.name}{provider.area ? ` · ${provider.area}` : ""} · ★ {provider.avgRating} · {provider.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 50, fontWeight: 600, color: "var(--teal)", lineHeight: 1 }}>{ts}</div>
            <div className="score-cap">trust score</div>
          </div>
        </div>

        {/* breakdown */}
        <div className="breakdown">
          <h3>What makes up this score</h3>
          {signals.map((s) => (
            <div className="sig" key={s.label}>
              <div className="sig-row"><span>{s.label}</span><span className="pts">{s.value} pts</span></div>
              <div className="track"><div className="fill" style={{ width: `${(s.value / maxPts) * 100}%` }} /></div>
            </div>
          ))}
          <p className="note">
            Completion and complaint history carry the most weight, because they predict reliability better than star ratings alone.
          </p>
          {provider.bio && <p style={{ color: "var(--ink-soft)", marginBottom: 20 }}>{provider.bio}</p>}
          {!showForm ? (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>Book this provider</button>
          ) : (
            <form onSubmit={book} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="label">Date</label>
                  <input className="input" type="date" name="scheduledDate" value={form.scheduledDate}
                    onChange={handleFormChange} required />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="label">Time</label>
                  <input className="input" type="time" name="scheduledTime" value={form.scheduledTime}
                    onChange={handleFormChange} required />
                </div>
              </div>
              <label className="label">Address</label>
              <input className="input" name="address" placeholder="Where should they come?"
                value={form.address} onChange={handleFormChange} required />
              <label className="label">What do you need done? (optional)</label>
              <textarea className="input" name="notes" rows={3} placeholder="Briefly describe the job"
                value={form.notes} onChange={handleFormChange} style={{ resize: "vertical", fontFamily: "inherit" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-primary" type="submit" disabled={booking}>
                  {booking ? "Requesting..." : "Confirm booking"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          )}
          {message && <p className="success-msg">{message}</p>}
        </div>
      </div>

      {/* reviews */}
      <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20, margin: "32px 0 14px" }}>Reviews</h3>
      {reviews.length === 0 ? (
        <p className="muted">No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div className="card" key={r._id} style={{ padding: "16px 20px" }}>
            <strong>★ {r.rating}</strong>
            {r.comment && <p style={{ margin: "6px 0 0", color: "var(--ink-soft)" }}>{r.comment}</p>}
          </div>
        ))
      )}
    </div>
  );
}

export default Provider;