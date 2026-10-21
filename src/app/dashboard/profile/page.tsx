"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./profile.css";

type Section =
  | "personal"
  | "health"
  | "plan"
  | "reminders"
  | "privacy"
  | "support"
  | null;

type Patient = {
  patientId?: number;
  fullName: string;
  email: string;
  phone: string;
  age: number | "";
  conditions: string;
  height: number | "";
  weight: number | "";
  bmi: number | "";
  planName: string;
  planStatus: string;
  remindersEnabled: boolean;
  whatsappReminders: boolean;
  emailReminders: boolean;
  consentGiven: boolean;
};

const API = {
  profile: "https://mediapi.unios.in/api/patient/profile",
  health: "https://mediapi.unios.in/api/patient/health-profile",
  plan: "/api/patient/plan",
  reminders: "/api/patient/reminders",
  privacy: "/api/patient/privacy",
  support: "/api/patient/support",
  logout: "/api/auth/logout",
};

const initialPatient: Patient = {
  fullName: "",
  email: "",
  phone: "",
  age: "",
  conditions: "",
  height: "",
  weight: "",
  bmi: "",
  planName: "No programme yet",
  planStatus: "Inactive",
  remindersEnabled: true,
  whatsappReminders: true,
  emailReminders: false,
  consentGiven: false,
};

const menu = [
  {
    id: "personal" as const,
    icon: "▤",
    title: "Personal details",
    subtitle: "Name, email and age",
  },
  {
    id: "health" as const,
    icon: "♡",
    title: "Health profile",
    subtitle: "Conditions and BMI",
  },
  {
    id: "plan" as const,
    icon: "▣",
    title: "Plan and payments",
    subtitle: "No programme yet",
  },
  {
    id: "reminders" as const,
    icon: "♧",
    title: "Reminders",
    subtitle: "Manage your notifications",
  },
  {
    id: "privacy" as const,
    icon: "⬡",
    title: "Privacy and security",
    subtitle: "Consents and your data",
  },
  {
    id: "support" as const,
    icon: "◎",
    title: "Help and support",
    subtitle: "FAQs, emergency",
  },
];

export default function ProfilePage() {
  const router = useRouter();

  const [patient, setPatient] = useState<Patient>(initialPatient);
  const [activeSection, setActiveSection] = useState<Section>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSubject, setSupportSubject] = useState("");
  const [prototype, setPrototype] = useState("Before visit 1");

  const getToken = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("medistry_auth_token") ||
        localStorage.getItem("auth_token")
      : null;

  async function apiRequest(url: string, method = "GET", body?: unknown) {
    const token = getToken();

    const response = await fetch(url, {
      method,
      headers: {
        ...(body instanceof FormData
          ? {}
          : body
            ? { "Content-Type": "application/json" }
            : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined
        ? {
            body: body instanceof FormData ? body : JSON.stringify(body),
          }
        : {}),
    });

    const text = await response.text();
    let result: any = {};

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed: ${response.status}`);
    }

    return result;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const result = await apiRequest(API.profile);

        // Supports common API response shapes.
        const data =
          result.data?.patient ?? result.data ?? result.patient ?? result;

        if (cancelled) return;

        setPatient((previous) => ({
          ...previous,
          ...data,
          fullName: data.fullName ?? data.FullName ?? previous.fullName,
          email: data.email ?? data.Email ?? previous.email,
          phone:
            data.phone ?? data.Phone ?? data.mobileNumber ?? previous.phone,
          age: data.age ?? data.Age ?? previous.age,
        }));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (
    field: keyof Patient,
    value: string | number | boolean,
  ) => {
    setPatient((previous) => {
      const updated = { ...previous, [field]: value };

      if (field === "height" || field === "weight") {
        const height = Number(updated.height);
        const weight = Number(updated.weight);

        updated.bmi =
          height > 0 && weight > 0
            ? Number((weight / (height / 100) ** 2).toFixed(1))
            : "";
      }

      return updated;
    });
  };

  async function saveSection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!activeSection) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const endpoints: Partial<Record<Exclude<Section, null>, string>> = {
        personal: API.profile,
        health: API.health,
        reminders: API.reminders,
        privacy: API.privacy,
      };

      if (activeSection === "support") {
        await apiRequest(API.support, "POST", {
          subject: supportSubject,
          message: supportMessage,
        });

        setSuccess("Support request submitted.");
        return;
      }

      if (activeSection === "plan") {
        setError(
          "Plan and payment details are read-only here. Connect your payment API to enable plan actions.",
        );
        return;
      }

      const endpoint = endpoints[activeSection];

      if (!endpoint) return;

      const payload =
        activeSection === "personal"
          ? {
              fullName: patient.fullName,
              email: patient.email,
              phone: patient.phone,
              age: patient.age,
            }
          : activeSection === "health"
            ? {
                conditions: patient.conditions,
                height: patient.height,
                weight: patient.weight,
                bmi: patient.bmi,
              }
            : activeSection === "reminders"
              ? {
                  remindersEnabled: patient.remindersEnabled,
                  whatsappReminders: patient.whatsappReminders,
                  emailReminders: patient.emailReminders,
                }
              : {
                  consentGiven: patient.consentGiven,
                };

      await apiRequest(endpoint, "PATCH", payload);
      setSuccess("Your changes have been saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    try {
      await apiRequest(API.logout, "POST");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      localStorage.removeItem("medistry_auth_token");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      router.replace("/login");
    }
  }

  const displayName = patient.fullName || "Patient";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  function renderForm() {
    switch (activeSection) {
      case "personal":
        return (
          <>
            <label>
              Full name *
              <input
                required
                value={patient.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
              />
            </label>

            <label>
              Email address *
              <input
                required
                type="email"
                value={patient.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </label>

            <label>
              Mobile number *
              <input
                required
                type="tel"
                pattern="[0-9+() -]{10,18}"
                value={patient.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </label>

            <label>
              Age *
              <input
                required
                type="number"
                min={1}
                max={120}
                value={patient.age}
                onChange={(e) =>
                  updateField(
                    "age",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </label>
          </>
        );

      case "health":
        return (
          <>
            <label>
              Medical conditions
              <textarea
                rows={3}
                value={patient.conditions}
                onChange={(e) => updateField("conditions", e.target.value)}
                placeholder="Enter conditions provided by your clinician"
              />
            </label>

            <div className="profile-form-grid">
              <label>
                Height (cm)
                <input
                  type="number"
                  min={1}
                  value={patient.height}
                  onChange={(e) =>
                    updateField(
                      "height",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </label>

              <label>
                Weight (kg)
                <input
                  type="number"
                  min={1}
                  value={patient.weight}
                  onChange={(e) =>
                    updateField(
                      "weight",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </label>
            </div>

            <p className="profile-muted">
              BMI: {patient.bmi || "Enter height and weight"}
            </p>
          </>
        );

      case "plan":
        return (
          <div className="profile-info">
            <p>
              <strong>Current plan:</strong> {patient.planName}
            </p>
            <p>
              <strong>Status:</strong> {patient.planStatus}
            </p>
            <p>
              Payment history and invoices will appear here when your
              payment-history API is connected.
            </p>
          </div>
        );

      case "reminders":
        return (
          <>
            <label className="profile-toggle">
              <span>Enable reminders</span>
              <input
                type="checkbox"
                checked={patient.remindersEnabled}
                onChange={(e) =>
                  updateField("remindersEnabled", e.target.checked)
                }
              />
            </label>

            <label className="profile-toggle">
              <span>WhatsApp reminders</span>
              <input
                type="checkbox"
                checked={patient.whatsappReminders}
                onChange={(e) =>
                  updateField("whatsappReminders", e.target.checked)
                }
              />
            </label>

            <label className="profile-toggle">
              <span>Email reminders</span>
              <input
                type="checkbox"
                checked={patient.emailReminders}
                onChange={(e) =>
                  updateField("emailReminders", e.target.checked)
                }
              />
            </label>
          </>
        );

      case "privacy":
        return (
          <>
            <p className="profile-muted">
              Manage your consent preferences. Changes are saved through your
              privacy API.
            </p>

            <label className="profile-toggle">
              <span>I consent to the applicable data-processing terms</span>
              <input
                type="checkbox"
                checked={patient.consentGiven}
                onChange={(e) => updateField("consentGiven", e.target.checked)}
              />
            </label>

            <p className="profile-muted">
              Password changes and account deletion require dedicated,
              authenticated backend endpoints.
            </p>
          </>
        );

      case "support":
        return (
          <>
            <label>
              Subject *
              <input
                required
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="How can we help?"
              />
            </label>

            <label>
              Message *
              <textarea
                required
                rows={4}
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your issue"
              />
            </label>

            <p className="profile-muted">
              For a medical emergency, contact your local emergency service
              instead of waiting for a support reply.
            </p>
          </>
        );

      default:
        return null;
    }
  }

  const activeItem = menu.find((item) => item.id === activeSection);

  return (
    <main className="profile-page">
      <header className="profile-header">
        <div>
          <h1>{loading ? "Loading profile..." : displayName}</h1>
          <p>{patient.phone || "Mobile number not available"}</p>
        </div>

        <div className="profile-avatar" aria-label={displayName}>
          {initials || "P"}
        </div>
      </header>

      {error && !activeSection && (
        <p className="profile-error" role="alert">
          {error}
        </p>
      )}

      <section className="profile-menu">
        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            className="profile-menu-item"
            onClick={() => {
              setError("");
              setSuccess("");
              setActiveSection(item.id);
            }}
          >
            <span className="profile-menu-icon">{item.icon}</span>

            <span className="profile-menu-copy">
              <strong>{item.title}</strong>
              <small>
                {item.id === "personal"
                  ? `${patient.email || "Email not added"} · Age ${patient.age || "—"}`
                  : item.id === "health"
                    ? `Conditions and BMI ${patient.bmi || ""}`
                    : item.id === "plan"
                      ? patient.planName
                      : item.subtitle}
              </small>
            </span>

            <span className="profile-chevron">›</span>
          </button>
        ))}
      </section>

      <section className="profile-prototype">
        <h2>Prototype</h2>

        <div className="profile-chips">
          {["Before visit 1", "After visit 1", "Week 3", "Week 8"].map(
            (item) => (
              <button
                key={item}
                type="button"
                className={prototype === item ? "selected" : ""}
                onClick={() => setPrototype(item)}
              >
                {item}
              </button>
            ),
          )}
        </div>
      </section>

      <footer className="profile-footer">
        <button type="button" className="profile-signout" onClick={signOut}>
          ⇥ &nbsp; Sign out
        </button>

        <span>Medistry for patients · Version 0.9</span>
      </footer>

      {activeSection && (
        <div
          className="profile-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActiveSection(null);
          }}
        >
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <header className="profile-modal-header">
              <div>
                <h2 id="profile-modal-title">{activeItem?.title}</h2>
                <p>{activeItem?.subtitle}</p>
              </div>

              <button
                type="button"
                className="profile-close"
                aria-label="Close"
                onClick={() => setActiveSection(null)}
              >
                ×
              </button>
            </header>

            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}

            {success && (
              <p className="profile-success" role="status">
                {success}
              </p>
            )}

            <form onSubmit={saveSection} className="profile-form">
              {renderForm()}

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-cancel"
                  onClick={() => setActiveSection(null)}
                >
                  Close
                </button>

                {activeSection !== "plan" && (
                  <button
                    type="submit"
                    className="profile-save"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : activeSection === "support"
                        ? "Send message"
                        : "Save changes"}
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
