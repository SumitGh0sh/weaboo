import React, { useState } from "react";
import { useApp } from "../context/AppContext";

export const MalLinkModal = () => {
  const { showMalLinkModal, setShowMalLinkModal, linkMalUser } = useApp();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null);

  if (!showMalLinkModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");
    const result = await linkMalUser(username);
    setLoading(false);

    if (result.success) {
      setSuccessData(username);
      setTimeout(() => {
        setSuccessData(null);
        setUsername("");
        setShowMalLinkModal(false);
      }, 2000);
    } else {
      setError(result.error || "User not found or connection failed");
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError("");
    setSuccessData(null);
    setShowMalLinkModal(false);
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={handleClose} aria-label="Close modal">
          <i className="fa-solid fa-xmark"></i>
        </button>

        {successData ? (
          <div style={styles.successContainer}>
            <div style={styles.successIcon}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={styles.title}>Account Linked!</h3>
            <p style={styles.text}>
              Successfully synced with <strong>{successData}</strong>'s MAL profile.
            </p>
          </div>
        ) : (
          <div style={styles.content}>
            <div style={styles.iconHeader}>
              <i className="fa-solid fa-link" style={{ color: "var(--accent)" }}></i>
              <span style={styles.malBadge}>MAL</span>
            </div>
            <h3 style={styles.title}>Link MyAnimeList</h3>
            <p style={styles.subtitle}>
              Enter your public MAL username to sync your statistics, ratings, and active watchlist.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputWrap}>
                <i className="fa-regular fa-user" style={styles.inputIcon}></i>
                <input
                  type="text"
                  placeholder="MyAnimeList Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  style={styles.input}
                  autoFocus
                />
              </div>

              {error && <div style={styles.errorText}>⚠️ {error}</div>}

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <div style={styles.spinner}></div>
                ) : (
                  <>
                    <span>Link Profile</span>
                    <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginLeft: "8px" }}></i>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8, 7, 12, 0.75)",
    backdropFilter: "blur(8px)",
    zIndex: 99999,
    display: "grid",
    placeItems: "center",
    padding: "20px",
    animation: "fadeIn 0.25s ease-out"
  },
  modal: {
    background: "linear-gradient(135deg, hsl(240 18% 7% / 0.9) 0%, hsl(240 18% 5% / 0.95) 100%)",
    border: "1px solid hsl(240 18% 12% / 0.6)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    position: "relative",
    padding: "36px 28px",
    boxSizing: "border-box",
    textAlign: "center"
  },
  closeBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "6px",
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
    color: "white",
    fontSize: "9px",
    fontWeight: "800",
    padding: "2px 5px",
    borderRadius: "4px",
    letterSpacing: "0.5px"
  },
  title: {
    fontSize: "20px",
    fontWeight: "750",
    color: "var(--text)",
    margin: "0 0 8px 0"
  },
  subtitle: {
    fontSize: "13px",
    color: "var(--muted)",
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
    color: "var(--muted)",
    fontSize: "15px"
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    background: "hsl(240 18% 4% / 0.8)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  errorText: {
    fontSize: "12px",
    color: "hsl(350 85% 55%)",
    textAlign: "left",
    padding: "0 4px"
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "var(--accent)",
    color: "hsl(220 25% 5%)",
    border: "none",
    borderRadius: "8px",
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
    border: "2px solid hsl(220 25% 5% / 0.2)",
    borderTopColor: "hsl(220 25% 5%)",
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
    color: "hsl(145 60% 50%)",
    marginBottom: "16px"
  },
  text: {
    fontSize: "14px",
    color: "var(--text-desc)",
    margin: "0",
    lineHeight: "1.5"
  }
};
