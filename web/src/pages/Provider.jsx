import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function Provider() {
  const { id } = useParams();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/providers/${id}`).then((res) => setProvider(res.data)).catch(() => {});
    api.get(`/reviews/provider/${id}`).then((res) => setReviews(res.data)).catch(() => {});
  }, [id]);

  const book = async () => {
    setMessage("");
    try {
      await api.post("/bookings", { providerId: id });
      setMessage("Booking requested! The provider will confirm.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Booking failed");
    }
  };

  if (!provider) return <p style={{ padding: 40 }}>Loading...</p>;

  const ts = provider.trustScore?.value ?? 0;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/search")}>&larr; Back to search</button>

      <h1 style={{ marginBottom: 0 }}>{provider.userId?.fullName}</h1>
      <p style={{ color: "#666" }}>{provider.serviceCategoryId?.name}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "16px 0" }}>
        <div style={{ fontSize: 42, fontWeight: "bold", color: "#2a9d8f" }}>{ts}</div>
        <div>
          <div>Trust score</div>
          <div style={{ fontSize: 13, color: "#666" }}>
            {provider.verificationTier} · ⭐ {provider.avgRating} · {provider.reviewCount} reviews
          </div>
        </div>
      </div>

            {provider.breakdown && (
        <div style={{ background: "#f6f6f6", borderRadius: 8, padding: 16, margin: "16px 0" }}>
          <strong style={{ display: "block", marginBottom: 8 }}>What makes up this score</strong>
          {[
            { label: "Job completion", value: provider.breakdown.completion },
            { label: "Low complaints", value: provider.breakdown.lowComplaints },
            { label: "Customer rating", value: provider.breakdown.rating },
            { label: "Verification", value: provider.breakdown.verification },
          ].map((row) => (
            <div key={row.label} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span>{row.label}</span>
                <span>{row.value} pts</span>
              </div>
              <div style={{ background: "#ddd", borderRadius: 4, height: 8, marginTop: 2 }}>
                <div style={{
                  background: "#2a9d8f", height: 8, borderRadius: 4,
                  width: `${row.value}%`,
                }} />
              </div>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
            These four signals are combined into the trust score. Completion and complaints carry the most weight.
          </p>
        </div>
      )}

      <p>{provider.bio}</p>

      <button onClick={book}
        style={{ padding: "10px 20px", background: "#2a9d8f", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>
        Book this provider
      </button>
      {message && <p style={{ color: "#2a9d8f", marginTop: 12 }}>{message}</p>}

      <h3 style={{ marginTop: 32 }}>Reviews</h3>
      {reviews.length === 0 ? (
        <p style={{ color: "#666" }}>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div key={r._id} style={{ borderTop: "1px solid #eee", padding: "8px 0" }}>
            <strong>⭐ {r.rating}</strong>
            <p style={{ margin: "4px 0", color: "#444" }}>{r.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default Provider;