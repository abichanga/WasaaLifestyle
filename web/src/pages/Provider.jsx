import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function Provider() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/providers/${id}`).then((res) => setProvider(res.data)).catch(() => {});
    api.get(`/reviews/provider/${id}`).then((res) => setReviews(res.data)).catch(() => {});
  }, [id]);

  const book = async () => {
    setMessage("");
    setBooking(true);
    try {
      await api.post("/bookings", { providerId: id });
      setMessage("Booking requested. The provider will confirm shortly.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

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

  return (
    <div className="page" style={{ maxWidth: 680 }}>
      <button className="btn btn-ghost" style={{ marginBottom: 24, padding: "8px 16px" }}
        onClick={() => navigate("/search")}>← Back to search</button>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* header */}
        <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 26, margin: "0 0 6px" }}>
              {provider.userId?.fullName}
            </h1>
            <div className="meta">
              <span className={`badge ${provider.verificationTier}`}>{provider.verificationTier}</span>
              <span className="sub">{provider.serviceCategoryId?.name} · ★ {provider.avgRating} · {provider.reviewCount} reviews</span>
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
          <button className="btn btn-primary" onClick={book} disabled={booking}>
            {booking ? "Requesting..." : "Book this provider"}
          </button>
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