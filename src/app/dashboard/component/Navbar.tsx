"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import s from "./Navbar.module.css";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  const handleSignOut = () => {
    // Clear authentication data
    localStorage.removeItem("medistry_auth_token");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");

    localStorage.removeItem("medistry_user");
    localStorage.removeItem("medistry_customer");
    localStorage.removeItem("auth_user");

    localStorage.removeItem("medistry_onboarding_mobile");

    setMenuOpen(false);
    router.replace("/");
  };

  return (
    <nav className={s.navbar}>
      {/* Logo */}
      <button
        type="button"
        className={s.logo}
        onClick={() => goTo("/dashboard")}
        aria-label="Go to dashboard"
      >
        <span className={s.logoDot}></span>
        medistry
      </button>

      {/* Navigation Links */}
      <div className={s.navLinks}>
        <button
          type="button"
          className={`${s.navLink} ${
            pathname === "/dashboard" ? s.active : ""
          }`}
          onClick={() => goTo("/dashboard")}
        >
          Home
        </button>

        <button
          type="button"
          className={`${s.navLink} ${
            pathname.startsWith("/dashboard/care") ? s.active : ""
          }`}
          onClick={() => goTo("/dashboard/care")}
        >
          Care
        </button>

        <button
          type="button"
          className={`${s.navLink} ${
            pathname.startsWith("/dashboard/resources") ? s.active : ""
          }`}
          onClick={() => goTo("/dashboard/resources")}
        >
          Resources
        </button>

        {/* <button
          type="button"
          className={`${s.navLink} ${
            pathname.startsWith("/dashboard/profile") ? s.active : ""
          }`}
          onClick={() => goTo("/dashboard/profile")}
        >
          Profile
        </button> */}
      </div>

      {/* Profile Dropdown */}
      <div className={s.profileMenu}>
        <button
          type="button"
          className={s.profileButton}
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <span className={s.profileAvatar}>V</span>
          <span className={s.profileButtonText}>My Account</span>
          <span
            className={`${s.chevron} ${menuOpen ? s.chevronOpen : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className={s.menuBackdrop}
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />

            <div className={s.dropdown} role="menu">
              <div className={s.dropdownHeader}>
                <span className={s.dropdownAvatar}>V</span>

                <div className={s.dropdownUserInfo}>
                  <strong>My Account</strong>
                  <span>Manage your account</span>
                </div>
              </div>

              <div className={s.dropdownDivider} />

              <button
                type="button"
                role="menuitem"
                className={s.dropdownItem}
                onClick={() => goTo("/dashboard/subcribe-plan")}
              >
                <span className={s.menuIcon}>⌂</span>
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={s.dropdownItem}
                onClick={() => goTo("/dashboard/profile")}
              >
                <span className={s.menuIcon}>♙</span>
                <span>Profile</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={s.dropdownItem}
                onClick={() => goTo("/dashboard/subscriptions")}
              >
                <span className={s.menuIcon}>♧</span>
                <span>Subscriptions</span>
              </button>

              <div className={s.dropdownDivider} />

              <button
                type="button"
                role="menuitem"
                className={`${s.dropdownItem} ${s.signOutItem}`}
                onClick={handleSignOut}
              >
                <span className={s.menuIcon}>↪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
