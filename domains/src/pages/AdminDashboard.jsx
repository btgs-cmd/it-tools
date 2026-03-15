import React, { useState, useEffect } from "react";
import {
  getClients, addClient, deleteClient,
  getAllDomains, addDomain, deleteDomain,
  getUnseenAlerts, markAlertSeen,
  generateToken, getDomainStatus
} from "../lib/firestore";
import DomainCard from "../components/DomainCard";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const SITE_URL = window.location.origin;

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [domains, setDomains] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedClient, setSelectedClient] = useState("all");
  const [tab, setTab] = useState("domains"); // domains | clients | alerts

  // Auth forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Add modals
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newDomainClient, setNewDomainClient] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    const [c, d, a] = await Promise.all([getClients(), getAllDomains(), getUnseenAlerts()]);
    setClients(c);
    setDomains(d);
    setAlerts(a);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError("Invalid credentials");
    }
  }

  async function handleAddClient(e) {
    e.preventDefault();
    if (!newClientName.trim()) return;
    setSaving(true);
    const token = generateToken();
    await addClient({ name: newClientName.trim(), email: newClientEmail.trim(), token });
    await loadData();
    setNewClientName(""); setNewClientEmail("");
    setShowAddClient(false);
    setSaving(false);
  }

  async function handleAddDomain(e) {
    e.preventDefault();
    if (!newDomain.trim() || !newDomainClient) return;
    setSaving(true);
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    await addDomain({ domain: clean, clientId: newDomainClient });
    await loadData();
    setNewDomain(""); setNewDomainClient("");
    setShowAddDomain(false);
    setSaving(false);
  }

  async function handleDeleteClient(id) {
    if (!confirm("Delete client and all their domains?")) return;
    await deleteClient(id);
    loadData();
  }

  async function handleDeleteDomain(id) {
    if (!confirm("Delete this domain?")) return;
    await deleteDomain(id);
    loadData();
  }

  const filteredDomains = selectedClient === "all"
    ? domains
    : domains.filter(d => d.clientId === selectedClient);

  const clientMap = Object.fromEntries(clients.map(c => [c.id, c]));

  const stats = {
    ok: domains.filter(d => d.status === "ok").length,
    warning: domains.filter(d => d.status === "warning").length,
    critical: domains.filter(d => ["critical", "expired"].includes(d.status)).length,
    unknown: domains.filter(d => d.status === "unknown").length,
  };

  // ── Login Screen ─────────────────────────────────────────
  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
    </div>
  );

  if (!user) return (
    <div style={styles.center}>
      <div style={styles.loginBox}>
        <div style={styles.logo}>⬡ DOMAIN TRACKER</div>
        <div style={{ color: "#555", fontSize: "13px", marginBottom: "32px", textAlign: "center" }}>
          Admin Access
        </div>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            style={styles.input}
            type="email" placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)} required
          />
          <input
            style={styles.input}
            type="password" placeholder="Password"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          {authError && <div style={{ color: "#ef4444", fontSize: "13px" }}>{authError}</div>}
          <button type="submit" style={styles.btnPrimary}>Sign In</button>
        </form>
      </div>
    </div>
  );

  // ── Main Dashboard ────────────────────────────────────────
  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "18px", color: "#00ff88", fontWeight: 700, letterSpacing: "0.1em" }}>
            ⬡ DOMAIN TRACKER
          </span>
          <span style={{ color: "#333", fontSize: "12px" }}>B-TGS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {alerts.length > 0 && (
            <div
              onClick={() => setTab("alerts")}
              style={{ cursor: "pointer", background: "#2d0a0a", border: "1px solid #ef444444", borderRadius: "6px", padding: "4px 12px", fontSize: "12px", color: "#ef4444" }}
            >
              🔔 {alerts.length} alert{alerts.length > 1 ? "s" : ""}
            </div>
          )}
          <button onClick={() => signOut(auth)} style={styles.btnGhost}>Sign Out</button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        {[
          { label: "Total", value: domains.length, color: "#888" },
          { label: "Active", value: stats.ok, color: "#22c55e" },
          { label: "Warning", value: stats.warning, color: "#f59e0b" },
          { label: "Critical", value: stats.critical, color: "#ef4444" },
          { label: "Unknown", value: stats.unknown, color: "#555" },
          { label: "Clients", value: clients.length, color: "#6366f1" },
        ].map(s => (
          <div key={s.label} style={styles.statItem}>
            <div style={{ fontSize: "24px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "11px", color: "#444", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {["domains", "clients", "alerts"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === "alerts" && alerts.length > 0 && (
              <span style={{ marginLeft: "6px", background: "#ef4444", borderRadius: "10px", padding: "1px 6px", fontSize: "10px" }}>
                {alerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>

        {/* DOMAINS TAB */}
        {tab === "domains" && (
          <div>
            <div style={styles.toolbar}>
              <select
                style={styles.select}
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
              >
                <option value="all">All Clients ({domains.length})</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({domains.filter(d => d.clientId === c.id).length})
                  </option>
                ))}
              </select>
              <button onClick={() => setShowAddDomain(true)} style={styles.btnPrimary}>
                + Add Domain
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              {filteredDomains.length === 0 ? (
                <div style={styles.empty}>No domains yet. Add one above.</div>
              ) : filteredDomains.map(d => (
                <div key={d.id}>
                  {selectedClient === "all" && clientMap[d.clientId] && (
                    <div style={{ fontSize: "11px", color: "#444", marginBottom: "4px", paddingLeft: "4px" }}>
                      {clientMap[d.clientId].name}
                    </div>
                  )}
                  <DomainCard domain={d} onDelete={handleDeleteDomain} isAdmin />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLIENTS TAB */}
        {tab === "clients" && (
          <div>
            <div style={styles.toolbar}>
              <span style={{ color: "#555", fontSize: "14px" }}>{clients.length} clients</span>
              <button onClick={() => setShowAddClient(true)} style={styles.btnPrimary}>
                + Add Client
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              {clients.length === 0 ? (
                <div style={styles.empty}>No clients yet.</div>
              ) : clients.map(c => {
                const clientDomains = domains.filter(d => d.clientId === c.id);
                const clientLink = `${SITE_URL}/domains/client/${c.token}`;
                return (
                  <div key={c.id} style={styles.clientCard}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "#f0f0f0", fontSize: "15px" }}>{c.name}</div>
                      {c.email && <div style={{ fontSize: "12px", color: "#555", marginTop: 2 }}>{c.email}</div>}
                      <div style={{ fontSize: "12px", color: "#444", marginTop: "8px" }}>
                        {clientDomains.length} domain{clientDomains.length !== 1 ? "s" : ""}
                        {" · "}
                        <a
                          href={clientLink}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#6366f1", textDecoration: "none" }}
                        >
                          Client link ↗
                        </a>
                        {" · "}
                        <span
                          style={{ color: "#555", cursor: "pointer", fontSize: "11px" }}
                          onClick={() => { navigator.clipboard.writeText(clientLink); }}
                        >
                          copy
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteClient(c.id)}
                      style={styles.btnDanger}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ALERTS TAB */}
        {tab === "alerts" && (
          <div>
            {alerts.length === 0 ? (
              <div style={styles.empty}>No active alerts. All good ✓</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {alerts.map(a => (
                  <div key={a.id} style={{ ...styles.clientCard, borderLeft: "3px solid #ef4444" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#ef4444", fontWeight: 600 }}>{a.domain}</div>
                      <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
                        {clientMap[a.clientId]?.name} · {a.type}
                      </div>
                    </div>
                    <button
                      onClick={async () => { await markAlertSeen(a.id); loadData(); }}
                      style={styles.btnGhost}
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Domain Modal */}
      {showAddDomain && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Add Domain</div>
            <form onSubmit={handleAddDomain} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                style={styles.input}
                placeholder="example.com"
                value={newDomain}
                onChange={e => setNewDomain(e.target.value)}
                required
              />
              <select
                style={styles.select}
                value={newDomainClient}
                onChange={e => setNewDomainClient(e.target.value)}
                required
              >
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setShowAddDomain(false)} style={{ ...styles.btnGhost, flex: 1 }}>Cancel</button>
                <button type="submit" style={{ ...styles.btnPrimary, flex: 1 }} disabled={saving}>
                  {saving ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClient && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalTitle}>Add Client</div>
            <form onSubmit={handleAddClient} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                style={styles.input}
                placeholder="Client name"
                value={newClientName}
                onChange={e => setNewClientName(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="email"
                placeholder="Email (optional)"
                value={newClientEmail}
                onChange={e => setNewClientEmail(e.target.value)}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setShowAddClient(false)} style={{ ...styles.btnGhost, flex: 1 }}>Cancel</button>
                <button type="submit" style={{ ...styles.btnPrimary, flex: 1 }} disabled={saving}>
                  {saving ? "Adding..." : "Add Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  center: {
    display: "flex", alignItems: "center", justifyContent: "center",
    minHeight: "100vh", background: "#0a0a0a",
  },
  loginBox: {
    background: "#111", border: "1px solid #222", borderRadius: "12px",
    padding: "40px", width: "320px",
  },
  logo: {
    fontSize: "20px", fontWeight: 700, color: "#00ff88",
    letterSpacing: "0.15em", textAlign: "center", marginBottom: "8px",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 24px", borderBottom: "1px solid #1a1a1a",
    position: "sticky", top: 0, background: "#0a0a0a", zIndex: 10,
  },
  statsBar: {
    display: "flex", gap: "0", borderBottom: "1px solid #1a1a1a",
  },
  statItem: {
    flex: 1, padding: "20px 24px", borderRight: "1px solid #1a1a1a", textAlign: "center",
  },
  tabs: {
    display: "flex", borderBottom: "1px solid #1a1a1a", padding: "0 24px",
  },
  tab: {
    background: "transparent", border: "none", color: "#555",
    padding: "12px 20px", cursor: "pointer", fontSize: "13px",
    borderBottom: "2px solid transparent", transition: "all 0.15s",
    fontFamily: "inherit",
  },
  tabActive: {
    color: "#00ff88", borderBottom: "2px solid #00ff88",
  },
  content: {
    padding: "24px", maxWidth: "900px", margin: "0 auto",
  },
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  clientCard: {
    background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px",
    padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px",
  },
  overlay: {
    position: "fixed", inset: 0, background: "#000000cc",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#111", border: "1px solid #333", borderRadius: "12px",
    padding: "32px", width: "360px",
  },
  modalTitle: {
    fontSize: "16px", fontWeight: 700, color: "#f0f0f0", marginBottom: "20px",
  },
  input: {
    background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "6px",
    color: "#f0f0f0", padding: "10px 14px", fontSize: "14px",
    fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
  },
  select: {
    background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: "6px",
    color: "#f0f0f0", padding: "10px 14px", fontSize: "14px",
    fontFamily: "inherit", outline: "none", width: "100%", cursor: "pointer",
  },
  btnPrimary: {
    background: "#00ff88", color: "#000", border: "none", borderRadius: "6px",
    padding: "10px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
    fontFamily: "inherit", letterSpacing: "0.05em",
  },
  btnGhost: {
    background: "transparent", color: "#555", border: "1px solid #2a2a2a",
    borderRadius: "6px", padding: "8px 16px", fontSize: "13px",
    cursor: "pointer", fontFamily: "inherit",
  },
  btnDanger: {
    background: "transparent", color: "#ef4444", border: "1px solid #ef444433",
    borderRadius: "6px", padding: "6px 14px", fontSize: "12px",
    cursor: "pointer", fontFamily: "inherit",
  },
  empty: {
    textAlign: "center", color: "#333", padding: "60px 0", fontSize: "14px",
  },
  spinner: {
    width: 32, height: 32, border: "2px solid #1a1a1a",
    borderTop: "2px solid #00ff88", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
