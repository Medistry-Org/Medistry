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
                onClick={() => goTo("/dashboard/appointment")}
              >
                <span className={s.menuIcon}>⌂</span>
                <span>Appointment</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={s.dropdownItem}
                onClick={() => goTo("/dashboard/consultation")}
              >
                <span className={s.menuIcon}>⌂</span>
                <span>consulation</span>
              </button>

              <button
                type="button"
                role="menuitem"
                className={s.dropdownItem}
                onClick={() => goTo("/dashboard/messages")}
              >
                <span className={s.menuIcon}>✉</span>
                <span>Messages</span>
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
//============================   import code hai yh bhai mera code mai  laset mai yh rakhna hai

// "use client";

// import { useState } from "react";
// import { usePathname, useRouter } from "next/navigation";
// import s from "./Navbar.module.css";
// import { API_BASE_URL } from "@/config/env";

// export default function Navbar() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const [menuOpen, setMenuOpen] = useState(false);
//   const [checkingAuth, setCheckingAuth] = useState(false);

//   // MyAccount button click par backend se live verification
//   const handleMyAccountClick = async () => {
//     // Agar menu pehle se khula hai toh band kar do
//     if (menuOpen) {
//       setMenuOpen(false);
//       return;
//     }

//     try {
//       setCheckingAuth(true);

//       const token =
//         localStorage.getItem("medistry_auth_token") ||
//         localStorage.getItem("auth_token") ||
//         localStorage.getItem("token");

//       const savedUser =
//         localStorage.getItem("medistry_user") ||
//         localStorage.getItem("auth_user");
//       const parsedUser = savedUser ? JSON.parse(savedUser) : null;
//       const userId =
//         parsedUser?.userId ||
//         parsedUser?.id ||
//         localStorage.getItem("current_subscribed_user");

//       const headers: Record<string, string> = {
//         Accept: "application/json",
//       };

//       if (token) {
//         headers["Authorization"] = `Bearer ${token.replace(/^"|"$/g, "")}`;
//       }

//       // Backend API call jo user ka active plan status verify karti hai
//       const res = await fetch(
//         `${API_BASE_URL}/api/subscriptions/status?userId=${encodeURIComponent(userId || "")}`,
//         {
//           method: "GET",
//           headers,
//         },
//       );

//       const data = await res.json();

//       // Check karo backend status
//       // (Backend field ke mutabik: data?.hasActivePlan ya data?.isActive)
//       const isSubscribed =
//         res.ok && (data?.hasActivePlan === true || data?.isActive === true);

//       if (!isSubscribed) {
//         // Plan nahi hai -> Redirect to Subscribe Plan Page
//         alert(
//           "Aapka subscription active nahi hai. Kripya pehle plan select karein.",
//         );
//         router.push("/dashboard/subcribe-plan");
//         return;
//       }

//       // Agar plan active hai -> Menu kholo
//       setMenuOpen(true);
//     } catch (err) {
//       console.error("Subscription check failed:", err);
//       // Fallback agar backend me error aaye toh plan page par bhej do
//       router.push("/dashboard/subcribe-plan");
//     } finally {
//       setCheckingAuth(false);
//     }
//   };

//   const goTo = (path: string) => {
//     setMenuOpen(false);
//     router.push(path);
//   };

//   const handleSignOut = () => {
//     localStorage.clear();
//     setMenuOpen(false);
//     router.replace("/");
//   };

//   return (
//     <nav className={s.navbar}>
//       <button
//         type="button"
//         className={s.logo}
//         onClick={() => goTo("/dashboard")}
//         aria-label="Go to dashboard"
//       >
//         <span className={s.logoDot}></span>
//         medistry
//       </button>

//       {/* Navigation Links */}
//       <div className={s.navLinks}>
//         <button
//           type="button"
//           className={`${s.navLink} ${pathname === "/dashboard" ? s.active : ""}`}
//           onClick={() => goTo("/dashboard")}
//         >
//           Home
//         </button>

//         <button
//           type="button"
//           className={`${s.navLink} ${pathname.startsWith("/dashboard/care") ? s.active : ""}`}
//           onClick={() => goTo("/dashboard/care")}
//         >
//           Care
//         </button>

//         <button
//           type="button"
//           className={`${s.navLink} ${pathname.startsWith("/dashboard/resources") ? s.active : ""}`}
//           onClick={() => goTo("/dashboard/resources")}
//         >
//           Resources
//         </button>
//       </div>

//       {/* Profile / MyAccount Button */}
//       <div className={s.profileMenu}>
//         <button
//           type="button"
//           className={s.profileButton}
//           onClick={handleMyAccountClick}
//           disabled={checkingAuth}
//           aria-label="Open profile menu"
//           aria-expanded={menuOpen}
//         >
//           <span className={s.profileAvatar}>V</span>
//           <span className={s.profileButtonText}>
//             {checkingAuth ? "Checking..." : "My Account"}
//           </span>
//           <span
//             className={`${s.chevron} ${menuOpen ? s.chevronOpen : ""}`}
//             aria-hidden="true"
//           >
//             ▾
//           </span>
//         </button>

//         {menuOpen && (
//           <>
//             <button
//               type="button"
//               className={s.menuBackdrop}
//               aria-label="Close menu"
//               onClick={() => setMenuOpen(false)}
//             />

//             <div className={s.dropdown} role="menu">
//               <div className={s.dropdownHeader}>
//                 <span className={s.dropdownAvatar}>V</span>
//                 <div className={s.dropdownUserInfo}>
//                   <strong>My Account</strong>
//                   <span>Active Member</span>
//                 </div>
//               </div>

//               <div className={s.dropdownDivider} />

//               <button
//                 type="button"
//                 role="menuitem"
//                 className={s.dropdownItem}
//                 onClick={() => goTo("/dashboard/messages")}
//               >
//                 <span className={s.menuIcon}>✉</span>
//                 <span>Messages</span>
//               </button>

//               <button
//                 type="button"
//                 role="menuitem"
//                 className={s.dropdownItem}
//                 onClick={() => goTo("/dashboard/profile")}
//               >
//                 <span className={s.menuIcon}>♙</span>
//                 <span>Profile</span>
//               </button>

//               <button
//                 type="button"
//                 role="menuitem"
//                 className={s.dropdownItem}
//                 onClick={() => goTo("/dashboard/subscriptions")}
//               >
//                 <span className={s.menuIcon}>♧</span>
//                 <span>Subscriptions</span>
//               </button>

//               <div className={s.dropdownDivider} />

//               <button
//                 type="button"
//                 role="menuitem"
//                 className={`${s.dropdownItem} ${s.signOutItem}`}
//                 onClick={handleSignOut}
//               >
//                 <span className={s.menuIcon}>↪</span>
//                 <span>Sign Out</span>
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </nav>
//   );
// }
