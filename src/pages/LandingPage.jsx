import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import gsap from "gsap";
import {
  Search,
  SlidersHorizontal,
  Play,
  Calendar,
  Flame,
  Clock,
  Tv,
  Sparkles,
  ArrowRight
} from "lucide-react";

// Reusable 3D Parallax layered container
const ParallaxPostersContainer = ({ children, className }) => {
  const [coords, setCoords] = useState({ x: 0, y: 0, active: false });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // [-0.5, 0.5]
    const y = (e.clientY - rect.top) / rect.height - 0.5; // [-0.5, 0.5]
    setCoords({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setCoords({ x: 0, y: 0, active: false });
  };

  return (
    <div
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
        transform: coords.active
          ? `rotateX(${coords.y * -16}deg) rotateY(${coords.x * 16}deg) scale(1.03)`
          : "rotateX(0deg) rotateY(0deg) scale(1)",
        transition: coords.active ? "transform 0.1s ease-out" : "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
      }}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        
        // If it's a ring, assign deep negative depth
        if (child.props && child.props.className && child.props.className.includes("landing-ring")) {
          const depth = child.props.className.includes("1") ? -30 : -50;
          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              transform: `translateZ(${depth}px)`,
              transformStyle: "preserve-3d"
            }
          });
        }

        // If it's a badge, assign high positive depth
        if (child.props && child.props.className && child.props.className.includes("landing-badge")) {
          return React.cloneElement(child, {
            style: {
              ...child.props.style,
              transform: "translateZ(80px)",
              transformStyle: "preserve-3d"
            }
          });
        }

        // If it's a poster, assign progressive depth based on zIndex
        if (child.props && child.props.style) {
          const zIndex = child.props.style.zIndex || 1;
          const translateZ = zIndex * 20; // 20px, 40px, 60px, 80px, 100px depth layers!
          
          return (
            <div
              style={{
                position: "absolute",
                left: child.props.style.left,
                top: child.props.style.top,
                zIndex: child.props.style.zIndex,
                transform: `translateZ(${translateZ}px)`,
                transformStyle: "preserve-3d"
              }}
            >
              {React.cloneElement(child, {
                style: {
                  ...child.props.style,
                  left: undefined,
                  top: undefined,
                  position: undefined,
                  zIndex: undefined
                }
              })}
            </div>
          );
        }

        return child;
      })}
    </div>
  );
};

export const LandingPage = () => {
  const navigate = useNavigate();
  const { setShowLoginModal, setLoginModalTab } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial Hero Entrance Animation
      gsap.from(".landing-brand", {
        opacity: 0,
        y: -40,
        duration: 1,
        ease: "power3.out"
      });
      gsap.from(".landing-hero__title", {
        opacity: 0,
        y: -30,
        duration: 1.2,
        delay: 0.2,
        ease: "power4.out"
      });
      gsap.from(".landing-search", {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.4,
        ease: "power3.out"
      });
      gsap.from(".landing-suggest", {
        opacity: 0,
        duration: 0.8,
        delay: 0.7
      });
      gsap.from(".landing-hero__actions", {
        opacity: 0,
        scale: 0.9,
        duration: 1,
        delay: 0.8,
        ease: "back.out(1.5)"
      });

      // 2. Continuous Floating Physics for About/Why posters
      gsap.utils.toArray(".landing-poster").forEach((poster, idx) => {
        gsap.to(poster, {
          y: "random(-12, 12)",
          x: "random(-6, 6)",
          rotation: `random(-14, 14)`,
          duration: "random(4, 6)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: idx * 0.15
        });
      });

      // 3. Scroll entrance triggers for About Section
      gsap.from(".landing-about .landing-kicker", {
        scrollTrigger: {
          trigger: ".landing-about",
          start: "top 80%"
        },
        opacity: 0,
        x: -20,
        duration: 0.6
      });
      
    }, containerRef);

  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/filter?keyword=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const suggestions = [
    { name: "Solo Leveling Season 2: Arise from the Shadow", path: "/anime/solo-leveling-season-2-arise-from-the-shadow-3eukp" },
    { name: "One Piece", path: "/anime/one-piece-odmau" },
    { name: "Sakamoto Days", path: "/anime/sakamoto-days-sfdxz" },
    { name: "Naruto: Shippuden", path: "/anime/naruto-shippuden-c8gov" },
    { name: "Solo Leveling", path: "/anime/solo-leveling-ilh08" },
    { name: "That Time I Got Reincarnated as a Slime Season 4", path: "/anime/that-time-i-got-reincarnated-as-a-slime-season-4-0u851" }
  ];

  return (
    <div className="landing" ref={containerRef}>
      {/* Top Navbar Header overlay on Landing page */}
      <header className="landing-navbar" style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 20 }}>
        <Link to="/home" className="brand" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="Weaboo" className="brand-logo" style={{ height: "38px", width: "auto", objectFit: "contain" }} />
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className="btn"
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "13px",
              fontWeight: "600",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg3)",
              color: "var(--text)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => { setShowLoginModal(true); setLoginModalTab("login"); }}
          >
            Login
          </button>
          <button
            className="btn"
            style={{
              height: "36px",
              padding: "0 16px",
              fontSize: "13px",
              fontWeight: "700",
              borderRadius: "8px",
              border: "none",
              background: "var(--accent)",
              color: "#090d16",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px hsl(192 100% 52% / 0.35)"
            }}
            onClick={() => { setShowLoginModal(true); setLoginModalTab("register"); }}
          >
            Register
          </button>
        </div>
      </header>

      <section className="landing-hero" aria-label="Home" style={{ paddingTop: "80px" }}>
        <h1 className="landing-hero__title">Watch Anime Free Online</h1>
        
        <form className="landing-search" onSubmit={handleSearchSubmit}>
          <label className="sr-only" htmlFor="landing-search-input">Search anime</label>
          <Search size={20} className="landing-search__icon" />
          <input
            type="search"
            id="landing-search-input"
            placeholder="Search anime…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            required
          />
          <Link to="/filter" className="landing-search__filter" aria-label="Filter">
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </Link>
        </form>

        <div className="landing-suggest">
          <span className="landing-suggest__label">Suggestion:</span>
          {suggestions.map((s, idx) => (
            <React.Fragment key={s.path}>
              <Link to={s.path}>{s.name}</Link>
              {idx < suggestions.length - 1 && <span className="landing-suggest__sep" aria-hidden="true">·</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="landing-hero__actions">
          <Link to="/home" className="btn btn-primary landing-btn">
            <Play size={16} style={{ marginRight: "6px" }} /> Watch now
          </Link>
          <Link to="/schedule" className="btn landing-btn landing-btn--outline">
            <Calendar size={16} style={{ marginRight: "6px" }} /> View Schedule
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section className="landing-section landing-about">
        <div className="landing-section__inner">
          <div className="landing-section__copy">
            <p className="landing-kicker">About Weaboo</p>
            <h2 className="landing-heading">Anime streaming done right — <em className="landing-accent">clean, fast,</em> and built for fans.</h2>
            <div className="landing-prose">
              <p>From action-packed shounen to slow-burn slice-of-life, anime brings stories you won't find anywhere else. Weaboo exists so you can watch them without fighting through ads, broken players, or sketchy redirects.</p>
              <p>We stripped away the noise and kept what matters: a deep catalog, a smooth player, sub and dub options, and tools like watchlists and continue-watching so you can actually follow the shows you love.</p>
            </div>
          </div>
          
          <ParallaxPostersContainer className="landing-visual landing-visual--posters">
            <Link to="/anime/solo-leveling-season-2-arise-from-the-shadow-3eukp" className="landing-poster" style={{ left: "6%", top: "4%", transform: "rotate(-12deg)", zIndex: 1 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/4b5ed938de41e4ff532c02c27dfd143a.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/one-piece-odmau" className="landing-poster" style={{ left: "26%", top: "-2%", transform: "rotate(5deg)", zIndex: 3 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/f899139df5e1059396431415e770c6dd.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/sakamoto-days-sfdxz" className="landing-poster" style={{ left: "46%", top: "10%", transform: "rotate(-5deg)", zIndex: 2 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/908e9281295d180348ec77afe6be6b01.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/naruto-shippuden-c8gov" className="landing-poster" style={{ left: "16%", top: "36%", transform: "rotate(9deg)", zIndex: 4 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/82cec96096d4281b7c95cd7e74623496.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/solo-leveling-ilh08" className="landing-poster" style={{ left: "40%", top: "40%", transform: "rotate(-7deg)", zIndex: 5 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/53adb96c287c3931b3bc41cebb003788.png" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <span className="landing-ring landing-ring--1"></span>
            <span className="landing-ring landing-ring--2"></span>
          </ParallaxPostersContainer>
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-section landing-why">
        <div className="landing-section__inner landing-section__inner--reverse">
          <ParallaxPostersContainer className="landing-visual landing-visual--posters landing-visual--why">
            <Link to="/anime/naruto-shippuden-c8gov" className="landing-poster" style={{ left: "2%", top: "6%", transform: "rotate(-9deg)", zIndex: 1 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/82cec96096d4281b7c95cd7e74623496.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/solo-leveling-ilh08" className="landing-poster" style={{ left: "20%", top: "0%", transform: "rotate(6deg)", zIndex: 3 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/53adb96c287c3931b3bc41cebb003788.png" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/that-time-i-got-reincarnated-as-a-slime-season-4-0u851" className="landing-poster" style={{ left: "38%", top: "16%", transform: "rotate(-4deg)", zIndex: 2 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/3889837143074f2ccb5989d34dc6e82b.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/bleach-yaa9n" className="landing-poster" style={{ left: "10%", top: "42%", transform: "rotate(8deg)", zIndex: 4 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/d58072be2820e8682c0a27c0518e805e.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <Link to="/anime/blue-lock-season-2-54rmn" className="landing-poster" style={{ left: "34%", top: "46%", transform: "rotate(-6deg)", zIndex: 5 }}>
              <img src="https://cdn.anipixcdn.co/thumbnail/d9ab9cc1bf456f1db82299d1226553e4.jpg" alt="" width="160" height="240" style={{ borderRadius: "var(--radius)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
            </Link>
            <div className="landing-badge">
              <Flame size={18} style={{ color: "var(--accent)" }} />
              <div>
                <strong>Fan Favourite</strong>
                <span>HD Streams</span>
              </div>
            </div>
          </ParallaxPostersContainer>

          <div className="landing-section__copy">
            <p className="landing-kicker">Why Weaboo?</p>
            <h2 className="landing-heading">Made for <em className="landing-accent">binge sessions</em>, not banner clicks.</h2>
            <ul className="landing-features">
              <li>
                <span className="landing-feature__icon"><Clock size={16} /></span>
                <div>
                  <h3>Continue Watching</h3>
                  <p>Jump back to the exact episode you left off — synced when you're signed in.</p>
                </div>
              </li>
              <li>
                <span className="landing-feature__icon"><Tv size={16} /></span>
                <div>
                  <h3>Sub &amp; Dub</h3>
                  <p>Filter and switch between subbed and dubbed releases on supported series.</p>
                </div>
              </li>
              <li>
                <span className="landing-feature__icon"><Calendar size={16} /></span>
                <div>
                  <h3>Weekly Schedule</h3>
                  <p>Track what airs this week so you never miss a new episode drop.</p>
                </div>
              </li>
              <li>
                <span className="landing-feature__icon"><Sparkles size={16} /></span>
                <div>
                  <h3>Smart Player</h3>
                  <p>Remembers your preferred server and source for a one-click next episode.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Full Catalog Section */}
      <section className="landing-section landing-library">
        <div className="landing-section__inner">
          <div className="landing-section__copy">
            <p className="landing-kicker">The Full Catalog</p>
            <h2 className="landing-heading">Seasonal hits, classics, movies — <em className="landing-accent">one search away.</em></h2>
            <div className="landing-prose">
              <p>Whether you want what's trending this season or a show from decades ago, Weaboo has it indexed with genres, scores, types, and instant play. Filter by sub, dub, year, or status and start watching in seconds.</p>
            </div>
            <Link to="/filter" className="landing-link">
              Browse all anime <ArrowRight size={16} style={{ marginLeft: "4px" }} />
            </Link>
          </div>
          <div className="landing-visual landing-visual--collage" aria-hidden="true">
            <div className="landing-collage">
              <Link to="/anime/solo-leveling-season-2-arise-from-the-shadow-3eukp" className="landing-collage__item landing-collage__item--1">
                <img src="https://image.tmdb.org/t/p/original/4dzp7aZnBaIL1YFzErKUdo6XWUn.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/one-piece-odmau" className="landing-collage__item landing-collage__item--2">
                <img src="https://image.tmdb.org/t/p/original/a6ptrTUH1c5OdWanjyYtAkOuYD0.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/sakamoto-days-sfdxz" className="landing-collage__item landing-collage__item--3">
                <img src="https://image.tmdb.org/t/p/original/blSthAPRbEOJBowdxppeQqNPRh9.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/naruto-shippuden-c8gov" className="landing-collage__item landing-collage__item--4">
                <img src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/1735.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/solo-leveling-ilh08" className="landing-collage__item landing-collage__item--5">
                <img src="https://image.tmdb.org/t/p/original/7qx4yq9395WxqJo2GvbwnzfEnBF.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/that-time-i-got-reincarnated-as-a-slime-season-4-0u851" className="landing-collage__item landing-collage__item--6">
                <img src="https://cdn.anipixcdn.co/background/14c2f4ab3ad95f50_1778862809.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/bleach-yaa9n" className="landing-collage__item landing-collage__item--7">
                <img src="https://s4.anilist.co/file/anilistcdn/media/anime/banner/269-08ar2HJOUAuL.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
              <Link to="/anime/blue-lock-season-2-54rmn" className="landing-collage__item landing-collage__item--8">
                <img src="https://image.tmdb.org/t/p/original/yr4JYozEY6KOVlBcs6rF2sLaCMU.jpg" alt="" style={{ borderRadius: "var(--radius)" }} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>Copyright © weaboo.to. All Rights Reserved</p>
      </footer>
    </div>
  );
};
