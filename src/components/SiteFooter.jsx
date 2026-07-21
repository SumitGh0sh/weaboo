import React from "react";
import { Link } from "react-router-dom";

// GitHub SVG Icon matching Lucide style
const GithubIcon = ({ size = 20, color = "#ffffff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// LinkedIn SVG Icon matching Lucide style
const LinkedinIcon = ({ size = 20, color = "#ffffff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" rx="1" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

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
        <div className="site-footer__grid" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", alignItems: "center" }}>
          <div className="site-footer__brand" style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="footer-logo">
              <Link to="/home">
                <img
                  src="/logo.png"
                  alt="Weaboo"
                  className="brand-logo"
                  style={{ height: "34px", width: "auto", objectFit: "contain" }}
                />
              </Link>
            </div>
          </div>

          <div className="site-footer__links">
            <ul className="footer-menu" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <li><Link to="/filter?help=dmca" style={{ color: "var(--muted)" }}>DMCA</Link></li>
              <li><Link to="/filter?help=terms" style={{ color: "var(--muted)" }}>Terms of Use</Link></li>
              <li><Link to="/filter?help=contact" style={{ color: "var(--muted)" }}>Contact</Link></li>
            </ul>
          </div>
        </div>

        {/* Developer Credit Section matching exact screenshot design */}
        <div
          className="developer-credit-bar"
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}
        >
          <span style={{ fontSize: "16px", color: "var(--text-desc)", fontWeight: "400", letterSpacing: "-0.2px" }}>
            Developed by <strong style={{ color: "#ffffff", fontWeight: "750" }}>Sumit Ghosh</strong>
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a
              href="https://github.com/SumitGh0sh"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-social-box"
              aria-label="GitHub Profile"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "hsl(240 18% 4% / 0.8)",
                border: "1px solid var(--border)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                textDecoration: "none",
                transition: "all 0.2s ease-in-out"
              }}
            >
              <GithubIcon size={20} color="#ffffff" />
            </a>

            <a
              href="https://www.linkedin.com/in/sumitgh0sh/"
              target="_blank"
              rel="noopener noreferrer"
              className="dev-social-box"
              aria-label="LinkedIn Profile"
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "hsl(240 18% 4% / 0.8)",
                border: "1px solid var(--border)",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                textDecoration: "none",
                transition: "all 0.2s ease-in-out"
              }}
            >
              <LinkedinIcon size={20} color="#ffffff" />
            </a>
          </div>
        </div>

        {/* Bottom copyright notice */}
        <div className="site-footer__bottom" style={{ marginTop: "16px", paddingTop: "12px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
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
