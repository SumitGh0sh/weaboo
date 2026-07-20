import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import gsap from "gsap";

export const LoginModal = () => {
  const {
    user,
    setUser,
    showLoginModal,
    setShowLoginModal,
    loginModalTab,
    setLoginModalTab
  } = useApp();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  // GSAP Opening Animations
  useEffect(() => {
    if (showLoginModal) {
      // Backdrop fade in
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );
      // Panel slide down + scale up
      gsap.fromTo(
        modalRef.current,
        { scale: 0.92, y: 20, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.6)" }
      );
    }
  }, [showLoginModal, loginModalTab]);

  if (!showLoginModal) return null;

  const handleClose = () => {
    // Animate closing before unmounting
    gsap.to(modalRef.current, {
      scale: 0.95,
      y: 15,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        setShowLoginModal(false);
        setErrorMsg("");
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
      }
    });
    gsap.to(backdropRef.current, {
      opacity: 0,
      duration: 0.2
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    setUser({ username: username.split("@")[0], email: username.includes("@") ? username : "user@weaboo.to" });
    handleClose();
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!email || !username || !password || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setUser({ username, email });
    handleClose();
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email.");
      return;
    }
    alert(`Reset link has been sent to ${email}`);
    setLoginModalTab("login");
    setErrorMsg("");
  };

  return (
    <div className="modal" style={{ display: "block" }}>
      {/* Glassmorphic backdrop */}
      <div
        ref={backdropRef}
        className="modal-backdrop"
        onClick={handleClose}
        style={{
          backdropFilter: "blur(6px)",
          background: "rgba(9, 7, 14, 0.75)"
        }}
      ></div>
      
      <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050 }}>
        
        {/* Panel wrapper with custom shadcn-style border glow */}
        <div
          ref={modalRef}
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px hsl(192 100% 52% / 0.15)",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "400px",
            overflow: "hidden"
          }}
        >

          {/* LOGIN TAB */}
          {loginModalTab === "login" && (
            <div className="modal-panel modal-content login" style={{ padding: "30px 24px" }}>
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>Login</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    fontSize: "22px",
                    cursor: "pointer"
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p className="modal-lead muted" style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
                  Welcome back — pick up where you left off.
                </p>
                {errorMsg && <div className="alert alert-error" style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "4px", background: "rgba(224, 36, 36, 0.1)", border: "1px solid rgba(224, 36, 36, 0.2)", color: "var(--red)" }}>{errorMsg}</div>}
                
                <form onSubmit={handleLogin} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Username or email</span>
                    <input
                      type="text"
                      required
                      placeholder="Username or email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Password</span>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <div className="modal-form-meta" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginTop: "4px" }}>
                    <div className="form-remember" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input type="checkbox" id="remember" defaultChecked />
                      <label htmlFor="remember" style={{ color: "var(--text-label)", cursor: "pointer" }}>Remember me</label>
                    </div>
                    <button type="button" className="modal-text-link" onClick={() => { setLoginModalTab("forgot"); setErrorMsg(""); }} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer" }}>
                      Forgot password?
                    </button>
                  </div>
                  <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", cursor: "pointer" }}>
                    Login
                  </button>
                </form>

                <div className="modal-social" aria-label="Social login" style={{ marginTop: "16px" }}>
                  <button type="button" className="btn-social btn-social--google" onClick={() => {
                    setUser({ username: "GoogleUser", email: "google@gmail.com" });
                    handleClose();
                  }} style={{ width: "100%", padding: "8px", border: "1px solid var(--border)", background: "var(--bg3)", color: "var(--text)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer" }}>
                    <i className="fa-brands fa-google" style={{ color: "var(--red)" }}></i>
                    <span>Continue with Google</span>
                  </button>
                </div>

                <div className="modal-alt" style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  <span className="modal-alt__label" style={{ fontSize: "12px", color: "var(--muted)" }}>New to Weaboo?</span>
                  <button type="button" className="btn btn-block modal-alt__btn" onClick={() => { setLoginModalTab("register"); setErrorMsg(""); }} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", cursor: "pointer" }}>
                    Create account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* REGISTER TAB */}
          {loginModalTab === "register" && (
            <div className="modal-panel modal-content register" style={{ padding: "30px 24px" }}>
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>Register</h2>
                <button type="button" onClick={handleClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "22px", cursor: "pointer" }}>&times;</button>
              </div>
              <div className="modal-body">
                <p className="modal-lead muted" style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
                  Create an account to sync your watchlist.
                </p>
                {errorMsg && <div className="alert alert-error" style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "4px", background: "rgba(224, 36, 36, 0.1)", border: "1px solid rgba(224, 36, 36, 0.2)", color: "var(--red)" }}>{errorMsg}</div>}
                
                <form onSubmit={handleRegister} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Email</span>
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Username</span>
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Password</span>
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Confirm Password</span>
                    <input
                      type="password"
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", cursor: "pointer" }}>
                    Create account
                  </button>
                </form>

                <div className="modal-alt" style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  <span className="modal-alt__label" style={{ fontSize: "12px", color: "var(--muted)" }}>Already have an account?</span>
                  <button type="button" className="btn btn-block modal-alt__btn" onClick={() => { setLoginModalTab("login"); setErrorMsg(""); }} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", cursor: "pointer" }}>
                    Back to login
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FORGOT PASSWORD TAB */}
          {loginModalTab === "forgot" && (
            <div className="modal-panel modal-content forgot" style={{ padding: "30px 24px" }}>
              <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>Reset password</h2>
                <button type="button" onClick={handleClose} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "22px", cursor: "pointer" }}>&times;</button>
              </div>
              <div className="modal-body">
                <p className="modal-lead muted" style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "20px" }}>
                  We’ll email you a reset link.
                </p>
                {errorMsg && <div className="alert alert-error" style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "4px", background: "rgba(224, 36, 36, 0.1)", border: "1px solid rgba(224, 36, 36, 0.2)", color: "var(--red)" }}>{errorMsg}</div>}
                
                <form onSubmit={handleReset} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <label className="field">
                    <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px", display: "block" }}>Email</span>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", fontSize: "13px" }}
                    />
                  </label>
                  <button className="btn btn-primary btn-block" type="submit" style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", cursor: "pointer" }}>
                    Send reset link
                  </button>
                </form>

                <div className="modal-alt" style={{ marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  <button type="button" className="btn btn-block modal-alt__btn" onClick={() => { setLoginModalTab("login"); setErrorMsg(""); }} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "6px", cursor: "pointer" }}>
                    Back to login
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
export default LoginModal;
