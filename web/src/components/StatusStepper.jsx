function StatusStepper({ status }) {
  // the happy path of statuses
  const steps = ["requested", "confirmed", "completed"];

  // rejected is a dead-end, show it separately
  if (status === "rejected") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0" }}>
        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--danger)" }} />
        <span style={{ color: "var(--danger)", fontSize: 13, fontWeight: 600 }}>Rejected</span>
      </div>
    );
  }

  const currentIndex = steps.indexOf(status);

  return (
    <div style={{ display: "flex", alignItems: "center", margin: "10px 0" }}>
      {steps.map((step, i) => {
        const done = i <= currentIndex;
        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "0 0 auto" }}>
            {/* dot + label */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%",
                background: done ? "var(--teal)" : "var(--line)",
                color: "#fff", fontSize: 11, display: "grid", placeItems: "center",
                transition: "background .2s",
              }}>
                {done ? "✓" : ""}
              </span>
              <span style={{
                fontSize: 11, textTransform: "capitalize",
                color: done ? "var(--teal)" : "var(--ink-soft)",
                fontWeight: done ? 600 : 400, whiteSpace: "nowrap",
              }}>{step}</span>
            </div>
            {/* connector line (not after the last step) */}
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: "0 6px", marginBottom: 18,
                background: i < currentIndex ? "var(--teal)" : "var(--line)",
                transition: "background .2s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StatusStepper;