import React from "react";
import { Link } from "react-router-dom";

export const SiteFooter = () => {
  const letters = [
    "All", "other", "0-9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* A-Z links */}
        <div className="site-footer__az">
          <div className="azlist-head">
            <div className="azlist-title">A-Z List</div>
            <div className="azlist-desc">Searching anime order by alphabet name A to Z.</div>
          </div>
          <ul className="azlist-links">
            {letters.map((letter) => (
              <li key={letter}>
                <Link to={`/filter?letter=${encodeURIComponent(letter)}`}>
                  {letter === "other" ? "#" : letter}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer info Grid */}
        <div className="site-footer__grid" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
          <div className="site-footer__brand">
            <div className="footer-logo">
              <Link to="/home">
                <img
                  src="/logo.png"
                  alt="Weaboo"
                  className="brand-logo"
                  style={{ height: "32px", width: "auto", objectFit: "contain" }}
                />
              </Link>
            </div>
            <div className="footer-socials" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span>Join now</span>
              <a href="https://reddit.com" target="_blank" rel="noopener noreferrer" className="social-reddit" aria-label="Reddit" style={{ color: "var(--text)" }}>
                <i className="fa-brands fa-reddit" style={{ fontSize: "20px" }}></i>
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="social-discord" aria-label="Discord" style={{ color: "var(--text)" }}>
                <i className="fa-brands fa-discord" style={{ fontSize: "20px" }}></i>
              </a>
            </div>
          </div>
          <div className="site-footer__links">
            <label style={{ display: "block", color: "var(--text)", fontWeight: "600", marginBottom: "8px" }}>Help</label>
            <ul className="footer-menu" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "16px" }}>
              <li><Link to="/filter?help=dmca" style={{ color: "var(--muted)" }}>DMCA</Link></li>
              <li><Link to="/filter?help=terms" style={{ color: "var(--muted)" }}>Terms of Use</Link></li>
              <li><Link to="/filter?help=contact" style={{ color: "var(--muted)" }}>Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="site-footer__bottom" style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div className="copyright" style={{ color: "var(--muted)", fontSize: "12px" }}>
            Copyright © weaboo.to. All Rights Reserved
          </div>
          <div className="disclaimer muted" style={{ fontSize: "11px", color: "var(--muted)", maxWidth: "500px" }}>
            This site does not store any files on its server. All contents are provided by non-affiliated third parties.
          </div>
        </div>
      </div>
    </footer>
  );
};
