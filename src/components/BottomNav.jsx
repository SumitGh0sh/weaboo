import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";

export const BottomNav = () => {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <nav className="bottom-nav" id="bottom-nav" aria-label="Quick navigation">
      <Link to="/home" className={`bottom-nav__item ${isActive("/home")}`}>
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
      </Link>
      
      <Link to="/filter?sort=updated" className={`bottom-nav__item ${isActive("/filter?sort=updated")}`}>
        <i className="fa-solid fa-clock-rotate-left"></i>
        <span>Updated</span>
      </Link>
      
      <Link to="/filter" className={`bottom-nav__item ${isActive("/filter")}`}>
        <i className="fa-solid fa-filter"></i>
        <span>Filter</span>
      </Link>
      
      <Link to="/schedule" className={`bottom-nav__item ${isActive("/schedule")}`}>
        <i className="fa-solid fa-calendar-days"></i>
        <span>Schedule</span>
      </Link>
      
      <button
        type="button"
        className="bottom-nav__item"
        id="bottom-nav-menu"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label="Open menu"
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <i className="fa-solid fa-bars"></i>
        <span>Menu</span>
      </button>
    </nav>
  );
};
export default BottomNav;
