import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";

export const MalCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeMalCodeForToken } = useApp();
  const [status, setStatus] = useState("exchanging"); // "exchanging", "success", "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("Authorization code was not returned by MyAnimeList.");
      return;
    }

    const performExchange = async () => {
      const result = await exchangeMalCodeForToken(code);
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        setStatus("error");
        setErrorMsg(result.error || "Failed to exchange authorization credentials.");
      }
    };

    performExchange();
  }, [searchParams, exchangeMalCodeForToken, navigate]);

  return (
    <div style={styles.container}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <img src="/logo.png" alt="Weaboo" style={styles.logo} />
        </div>

        {status === "exchanging" && (
          <div style={styles.content}>
            <div style={styles.spinner}></div>
            <h3 style={styles.title}>Connecting to MyAnimeList...</h3>
            <p style={styles.text}>Securing auth handshake and importing list statistics.</p>
          </div>
        )}

        {status === "success" && (
          <div style={styles.content}>
            <div style={styles.successIcon}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h3 style={styles.title}>Account Connected!</h3>
            <p style={styles.text}>Redirecting you back to Weaboo Home...</p>
          </div>
        )}

        {status === "error" && (
          <div style={styles.content}>
            <div style={styles.errorIcon}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style={styles.title}>Connection Failed</h3>
            <p style={styles.errorText}>{errorMsg}</p>
            <button onClick={() => navigate("/home")} style={styles.btn}>
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#060a14",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: "var(--font-sans)"
  },
  card: {
    background: "linear-gradient(145deg, #0e172a 0%, #0a1122 100%)",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "40px 30px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.6)"
  },
  logoWrap: {
    marginBottom: "28px"
  },
  logo: {
    height: "44px",
    width: "auto"
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px"
  },
  spinner: {
    width: "38px",
    height: "38px",
    border: "3px solid rgba(60, 214, 255, 0.1)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  title: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc",
    margin: 0
  },
  text: {
    fontSize: "13px",
    color: "#94a3b8",
    margin: 0,
    lineHeight: "1.5"
  },
  successIcon: {
    fontSize: "36px",
    color: "var(--accent2)"
  },
  errorIcon: {
    fontSize: "36px",
    color: "hsl(350 85% 55%)"
  },
  errorText: {
    fontSize: "13px",
    color: "#ef4444",
    margin: 0,
    lineHeight: "1.5"
  },
  btn: {
    marginTop: "12px",
    padding: "10px 20px",
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    color: "#f8fafc",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

export default MalCallbackPage;
