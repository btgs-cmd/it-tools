import React from "react";

const STATUS_CONFIG = {
  ok:       { label: "Active",   color: "#22c55e", bg: "#052e16" },
  warning:  { label: "Warning",  color: "#f59e0b", bg: "#2d1a00" },
  critical: { label: "Critical", color: "#ef4444", bg: "#2d0a0a" },
  expired:  { label: "Expired",  color: "#6b7280", bg: "#1a1a1a" },
  unknown:  { label: "Checking", color: "#6b7280", bg: "#1a1a1a" },
};

export default function DomainCard({ domain, onDelete, isAdmin }) {
  const cfg = STATUS_CONFIG[domain.status] || STATUS_CONFIG.unknown;
  const expiry = domain.expiryDate?.toDate?.() ?? null;

  return (
    <div style={{
      background: "#111",
      border: `1px solid ${cfg.color}33`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: "8px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      transition: "all 0.2s",
    }}>
      {/* Status dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: cfg.color,
        boxShadow: `0 0 8px ${cfg.color}`,
        flexShrink: 0,
      }} />

      {/* Domain info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "monospace", fontSize: "15px", color: "#f0f0f0", fontWeight: 600 }}>
          {domain.domain}
        </div>
        {domain.registrar && (
          <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
            {domain.registrar}
          </div>
        )}
      </div>

      {/* Expiry info */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {domain.daysUntilExpiry !== null && domain.daysUntilExpiry !== undefined ? (
          <>
            <div style={{ fontSize: "22px", fontWeight: 700, color: cfg.color, lineHeight: 1 }}>
              {domain.daysUntilExpiry <= 0 ? "—" : domain.daysUntilExpiry}
            </div>
            <div style={{ fontSize: "11px", color: "#555", marginTop: 2 }}>
              {domain.daysUntilExpiry <= 0 ? "expired" : "days left"}
            </div>
          </>
        ) : (
          <div style={{ fontSize: "12px", color: "#555" }}>checking...</div>
        )}
        {expiry && (
          <div style={{ fontSize: "11px", color: "#444", marginTop: 4 }}>
            {expiry.toLocaleDateString("en-GB")}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}44`,
        borderRadius: "4px",
        padding: "3px 10px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        flexShrink: 0,
      }}>
        {cfg.label}
      </div>

      {/* Delete (admin only) */}
      {isAdmin && (
        <button
          onClick={() => onDelete(domain.id)}
          style={{
            background: "transparent",
            border: "1px solid #333",
            borderRadius: "4px",
            color: "#555",
            cursor: "pointer",
            padding: "4px 8px",
            fontSize: "13px",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#555"; }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
