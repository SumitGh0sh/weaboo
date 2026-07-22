import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export const MalLinkModal = () => {
  const { showMalLinkModal, setShowMalLinkModal, initiateMalLogin } = useApp();

  if (!showMalLinkModal) return null;

  const handleClose = () => {
    setShowMalLinkModal(false);
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div style={styles.content}>
          <div style={styles.iconHeader}>
            <i className="fa-solid fa-link" style={{ color: "var(--accent)" }}></i>
            <span style={styles.malBadge}>MAL</span>
          </div>
          <h3 style={styles.title}>Link MyAnimeList</h3>
          <p style={styles.subtitle}>
            Connect securely using official MyAnimeList OAuth 2.0 to sync your statistics, ratings, and active watchlist.
          </p>

          <button onClick={initiateMalLogin} style={styles.submitBtn}>
            <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: "8px" }}></i>
            <span>Connect with MyAnimeList</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(6, 10, 20, 0.82)",
    backdropFilter: "blur(10px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    animation: "fadeIn 0.25s ease-out"
  },
  modal: {
    background: "linear-gradient(145deg, #0e172a 0%, #0a1122 100%)",
    border: "1px solid #1e293b",
    boxShadow: "0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
    borderRadius: "18px",
    width: "100%",
    maxWidth: "420px",
    position: "relative",
    padding: "36px 28px",
    boxSizing: "border-box",
    textAlign: "center"
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "50%",
    width: "32px",
    height: "32px",
    color: "#94a3b8",
    fontSize: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "color 0.2s"
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  iconHeader: {
    fontSize: "32px",
    position: "relative",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  malBadge: {
    position: "absolute",
    bottom: "-6px",
    right: "-12px",
    background: "#2e51a2",
    color: "#ffffff",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "4px",
    letterSpacing: "0.5px"
  },
  title: {
    fontSize: "20px",
    fontWeight: "750",
    color: "#f8fafc",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.5",
    margin: "0 0 24px 0",
    padding: "0 8px"
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  inputWrap: {
    position: "relative",
    width: "100%"
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
    fontSize: "15px"
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    background: "#131c2e",
    border: "1px solid #1e293b",
    borderRadius: "9px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  errorText: {
    fontSize: "12px",
    color: "#ef4444",
    textAlign: "left",
    padding: "0 4px"
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #2e51a2 0%, #1e3a8a 100%)",
    color: "#ffffff",
    border: "1px solid #3b82f6",
    borderRadius: "9px",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "transform 0.2s, opacity 0.2s",
    marginTop: "8px"
  },
  spinner: {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255, 255, 255, 0.2)",
    borderTopColor: "#ffffff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  },
  successContainer: {
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  successIcon: {
    fontSize: "48px",
    color: "#22c55e",
    marginBottom: "16px"
  },
  text: {
    fontSize: "14px",
    color: "#cbd5e1",
    margin: "0",
    lineHeight: "1.5"
  }
};
