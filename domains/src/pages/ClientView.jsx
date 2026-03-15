import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getClientByToken, getDomainsForClient } from "../lib/firestore";
import DomainCard from "../components/DomainCard";

export default function ClientView() {
  const { token } = useParams();
  const [client, setClient] = useState(null);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const c = await getClientByToken(token);
      if (!c) { setNotFound(true); setLoading(false); return; }
      const d = await getDomainsForClient(c.id);
      // Sort by daysUntilExpiry ascending (nulls last)
      d.sort((a, b) => {
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });
      setClient(c);
      setDomains(d);
      setLoading(false);
    }
    load();
  }, [token]);

  const hasIssues = domains.some(d => ["critical", "warning", "expired"].includes(d.status));

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  if (notFound) return (
    <div style={styles.center}>
      <div style={{ color: "#333", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⬡</div>
        <div style={{ fontSize: "14px" }}>Page not found</div>
      </div>
    </div>
  );

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.logo}>⬡ DOMAIN STATUS</div>
            <div style={styles.clientName}>{client.name}</div>
          </div>
          <div style={{
            background: hasIssues ? "#2d0a0a" : "#052e16",
            border: `1px solid ${hasIssues ? "#ef444444" : "#22c55e44"}`,
            borderRadius: "8px",
            padding: "12px 20px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: hasIssues ? "#ef4444" : "#22c55e" }}>
              {hasIssues ? "⚠" : "✓"}
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginTop: 2 }}>
              {hasIssues ? "Action needed" : "All good"}
            </div>
          </div>
        </div>

        {/* Summary badges */}
        <div style={styles.badges}>
          {[
            { label: "Total", count: domains.length, color: "#888" },
            { label: "Active", count: domains.filter(d => d.status === "ok").length, color: "#22c55e" },
            { label: "Warning", count: domains.filter(d => d.status === "warning").length, color: "#f59e0b" },
            { label: "Critical", count: domains.filter(d => ["critical","expired"].includes(d.status)).length, color: "#ef4444" },
          ].map(b => b.count > 0 || b.label === "Total" ? (
            <div key={b.label} style={{ ...styles.badge, color: b.color }}>
              <span style={{ fontWeight: 700 }}>{b.count}</span>
              <span style={{ fontSize: "11px", color: "#444", marginLeft: "6px" }}>{b.label}</span>
            </div>
          ) : null)}
        </div>

        {/* Domains */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {domains.length === 0 ? (
            <div style={styles.empty}>No domains configured yet.</div>
          ) : domains.map(d => (
            <DomainCard key={d.id} domain={d} isAdmin={false} />
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Managed by B-TGS · {new Date().toLocaleDateString("en-GB")}
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
  },
  container: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  center: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#0a0a0a",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: "28px",
  },
  logo: {
    fontSize: "12px", color: "#333", letterSpacing: "0.2em",
    marginBottom: "6px",
  },
  clientName: {
    fontSize: "22px", fontWeight: 700, color: "#f0f0f0",
  },
  badges: {
    display: "flex", gap: "16px", marginBottom: "20px",
    borderBottom: "1px solid #1a1a1a", paddingBottom: "20px",
  },
  badge: {
    display: "flex", alignItems: "center",
    fontSize: "16px",
  },
  empty: {
    textAlign: "center", color: "#333", padding: "60px 0", fontSize: "14px",
  },
  footer: {
    marginTop: "40px", textAlign: "center",
    fontSize: "11px", color: "#2a2a2a",
  },
  spinner: {
    width: 28, height: 28, border: "2px solid #1a1a1a",
    borderTop: "2px solid #00ff88", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
