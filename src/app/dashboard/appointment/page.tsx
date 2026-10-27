"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Search,
  Star,
  ChevronRight,
  ChevronLeft,
  Video,
  Building2,
  Info,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { API_BASE_URL } from "@/config/env";
import styles from "./AppointmentBooking.module.css";
import { useRouter } from "next/navigation";

export interface Doctor {
  id: string | number;
  name: string;
  specialty: string;
  experience?: string;
  rating?: number;
  reviewsCount?: number;
  fee?: number;
  image?: string;
}

// Backend Slot Type
export interface SlotItem {
  slotId: number;
  startTime: string;
  endTime: string;
  displayTime: string;
}

// Backend Appointment Booking Payload
export interface AppointmentPayload {
  slotId: number;
  consultationType: "Virtual" | "Clinic";
  reason: string;
}

const categories = [
  "All",
  "General Physician",
  "Dermatologist",
  "Cardiologist",
];

// Helper: Date ko 'YYYY-MM-DD' format me convert karna
const formatDateKey = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: '10:00:00' ko '10:00 AM' me format karna
const formatSlotTime = (timeStr: string) => {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

export default function AppointmentBookingPage() {
  const router = useRouter();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Dynamic Date States
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatDateKey(new Date()),
  );

  // Slots array me backend ke actual objects rahenge
  const [availableSlots, setAvailableSlots] = useState<SlotItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  const [consultationType, setConsultationType] = useState<"VIDEO" | "CLINIC">(
    "VIDEO",
  );
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch Doctors from Backend
  useEffect(() => {
    async function fetchDoctors() {
      try {
        setLoadingDoctors(true);
        const endpoint = `${API_BASE_URL}/api/doctors`;
        const res = await fetch(endpoint);
        const data = await res.json();

        let rawList: any[] = [];
        if (Array.isArray(data)) {
          rawList = data;
        } else if (Array.isArray(data?.data)) {
          rawList = data.data;
        } else if (Array.isArray(data?.doctors)) {
          rawList = data.doctors;
        } else if (Array.isArray(data?.result)) {
          rawList = data.result;
        }

        const mappedDoctors: Doctor[] = rawList.map((doc: any) => ({
          id: doc.DoctorId ?? doc.id,
          name: doc.FullName ?? doc.name ?? "Doctor",
          specialty: doc.Specialization ?? doc.specialty ?? "General",
          experience: doc.ExperienceYears
            ? `${doc.ExperienceYears} yrs exp`
            : doc.experience || "Experienced",
          fee: doc.ConsultationFee ?? doc.fee ?? 500,
          rating: doc.Rating ?? doc.rating ?? 4.5,
          reviewsCount: doc.ReviewsCount ?? doc.reviewsCount ?? 10,
          image: doc.ProfileImageUrl ?? doc.image ?? "",
        }));

        setDoctors(mappedDoctors);

        if (mappedDoctors.length > 0) {
          setSelectedDoctor(mappedDoctors[0]);
        }
      } catch (err) {
        console.error("Doctors fetch error:", err);
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    }

    fetchDoctors();
  }, []);

  // 2. Fetch Slots on Doctor or Date change
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDoctor?.id || !selectedDate) return;
      try {
        setLoadingSlots(true);
        const endpointUrl = `${API_BASE_URL}/api/schedule/slots/${selectedDoctor.id}/${selectedDate}`;

        const res = await fetch(endpointUrl);
        const data = await res.json();

        const rawSlots: any[] = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : [];

        const slotsList: SlotItem[] = rawSlots
          .filter(
            (item: any) =>
              !item.Status || String(item.Status).toLowerCase() === "available",
          )
          .map((item: any) => {
            const startFmt = formatSlotTime(item.StartTime || "");
            const endFmt = formatSlotTime(item.EndTime || "");
            const label = endFmt ? `${startFmt} - ${endFmt}` : startFmt;

            return {
              slotId: Number(item.SlotId),
              startTime: item.StartTime,
              endTime: item.EndTime,
              displayTime: label,
            };
          })
          .filter((item) => item.slotId && item.displayTime);

        setAvailableSlots(slotsList);

        if (slotsList.length > 0) {
          setSelectedSlot(slotsList[0]);
        } else {
          setSelectedSlot(null);
        }
      } catch (err) {
        console.error("Error fetching slots:", err);
        setAvailableSlots([]);
        setSelectedSlot(null);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDoctor, selectedDate]);

  // Date Navigation Handlers
  const handlePrevMonth = () => {
    setCurrentViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentViewDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
  };

  // Generate All Days for Current Viewing Month
  const daysInCurrentMonth = React.useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const thisDate = new Date(year, month, dayNum);
      const dateKey = formatDateKey(thisDate);
      const dayName = dayLabels[thisDate.getDay()];
      const isPast = thisDate < today;

      days.push({
        dayNum,
        dayName,
        dateKey,
        isPast,
      });
    }
    return days;
  }, [currentViewDate]);

  const monthYearDisplay = currentViewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // 3. Handle Appointment Booking
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot?.slotId) {
      alert("Kripya ek Time Slot select karein!");
      return;
    }

    const payload: AppointmentPayload = {
      slotId: selectedSlot.slotId,
      consultationType: consultationType === "VIDEO" ? "Virtual" : "Clinic",
      reason: notes ? `${symptoms} | Note: ${notes}` : symptoms,
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("medistry_auth_token");

      const bookingUrl = `${API_BASE_URL}/api/schedule/book`;
      const res = await fetch(bookingUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (res.ok && responseData.success !== false) {
        alert("Appointment successfully book ho gaya!");
        setSymptoms("");
        setNotes("");
        router.push("/dashboard");
      } else {
        alert(
          responseData.message || "Booking fail ho gayi, kripya check karein.",
        );
      }
    } catch (error) {
      console.error("Appointment booking error:", error);
      alert("Server error: Appointment book karne me issue aaya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeDoctorList = Array.isArray(doctors) ? doctors : [];
  const filteredDoctors = safeDoctorList.filter((doc) => {
    if (!doc) return false;
    const name = String(doc.name || "").toLowerCase();
    const specialty = String(doc.specialty || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || specialty.includes(query);
    const matchesCategory =
      selectedCategory === "All" ||
      specialty === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={styles.container}>
      {/* Top Header Section */}
      <div className={styles.headerSection}>
        <button
          type="button"
          onClick={() => window.history.back()}
          className={styles.backBtn}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Book an Appointment</h1>
            <p className={styles.pageSubtitle}>
              Find the right doctor and book your consultation in a few simple
              steps.
            </p>
          </div>

          {/* Stepper */}
          <div className={styles.stepper}>
            <div className={styles.stepItem}>
              <span className={styles.stepBadgeActive}>1</span>
              <span className={styles.stepLabelActive}>Select Doctor</span>
            </div>
            <div className={styles.stepDivider}></div>
            <div className={styles.stepItem}>
              <span className={styles.stepBadge}>2</span>
              <span className={styles.stepLabel}>Select Date & Slot</span>
            </div>
            <div className={styles.stepDivider}></div>
            <div className={styles.stepItem}>
              <span className={styles.stepBadge}>3</span>
              <span className={styles.stepLabel}>Appointment Details</span>
            </div>
            <div className={styles.stepDivider}></div>
            <div className={styles.stepItem}>
              <span className={styles.stepBadge}>4</span>
              <span className={styles.stepLabel}>Confirm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className={styles.mainGrid}>
        {/* Column 1: Doctors */}
        <div className={`${styles.card} ${styles.cardFixedDoctor}`}>
          <h2 className={styles.sectionTitle}>1. Select Doctor</h2>

          <div className={styles.searchBox}>
            <Search className={styles.searchIcon} size={17} />
            <input
              type="text"
              placeholder="Search doctors by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`${styles.categoryBtn} ${
                  selectedCategory === cat ? styles.categoryBtnActive : ""
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className={styles.doctorList}>
            {loadingDoctors ? (
              <p className={styles.statusMessage}>
                Doctors load ho rahe hain...
              </p>
            ) : filteredDoctors.length === 0 ? (
              <p className={styles.statusMessage}>Koi doctor nahi mila.</p>
            ) : (
              filteredDoctors.map((doc) => {
                const isSelected = selectedDoctor?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`${styles.doctorCard} ${
                      isSelected ? styles.doctorCardActive : ""
                    }`}
                  >
                    <div className={styles.doctorCardInner}>
                      <div className={styles.doctorAvatar}>
                        {doc.image ? (
                          <Image
                            src={doc.image}
                            alt={doc.name}
                            fill
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div className={styles.avatarFallback}>
                            {doc.name?.charAt(0) || "D"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={styles.docName}>{doc.name}</h3>
                        <p className={styles.docSpecialty}>{doc.specialty}</p>
                        <p className={styles.docExp}>
                          {doc.experience || "Experienced"}
                        </p>
                        <div className={styles.ratingRow}>
                          <Star size={13} fill="#fbbf24" stroke="#fbbf24" />
                          <span>{doc.rating || 4.5}</span>
                          <span className={styles.reviewsCount}>
                            ({doc.reviewsCount || 0} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={styles.doctorPriceInfo}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "6px",
                      }}
                    >
                      <div>
                        <div className={styles.feeAmount}>
                          ₹{doc.fee || 500}
                        </div>
                        <div className={styles.feeLabel}>Consultation Fee</div>
                      </div>

                      {/* Card Action Row: Chat Button & Arrow */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "4px",
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/chat/${doc.id}`);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#eff6ff",
                            color: "#2563eb",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "#2563eb";
                            (e.currentTarget as HTMLElement).style.color =
                              "#ffffff";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLElement
                            ).style.backgroundColor = "#eff6ff";
                            (e.currentTarget as HTMLElement).style.color =
                              "#2563eb";
                          }}
                        >
                          <MessageSquare size={12} />
                          Chat
                        </button>
                        <ChevronRight
                          size={16}
                          color={isSelected ? "#2563eb" : "#94a3b8"}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Date & Slot */}
        <div className={`${styles.card} ${styles.cardBetween}`}>
          <div>
            <h2 className={styles.sectionTitle}>2. Select Date & Slot</h2>

            {selectedDoctor && (
              <div className={styles.selectedDocBanner}>
                <div className={styles.doctorCardInner}>
                  <div className={styles.doctorAvatar}>
                    {selectedDoctor.image ? (
                      <Image
                        src={selectedDoctor.image}
                        alt={selectedDoctor.name}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div className={styles.avatarFallback}>
                        {selectedDoctor.name?.charAt(0) || "D"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={styles.docName}>{selectedDoctor.name}</h3>
                    <p className={styles.docSpecialty}>
                      {selectedDoctor.specialty}
                    </p>
                    <div className={styles.ratingRow}>
                      <Star size={12} fill="#fbbf24" stroke="#fbbf24" />
                      <span>{selectedDoctor.rating || 4.5}</span>
                      <span className={styles.reviewsCount}>
                        ({selectedDoctor.reviewsCount || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "6px",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <div className={styles.feeAmount}>
                      ₹{selectedDoctor.fee || 500}
                    </div>
                    <div className={styles.feeLabel}>Consultation Fee</div>
                  </div>

                  {/* Prominent Chat Button in Selected Doctor Banner */}
                  <button
                    type="button"
                    onClick={() => router.push(`/chat/${selectedDoctor.id}`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <MessageSquare size={13} />
                    Chat with Doctor
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Date Picker */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div className={styles.dateHeader}>
                <span className={styles.subHeading}>Select Date</span>
                <div className={styles.monthSwitcher}>
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className={styles.navIconBtn}
                    aria-label="Previous Month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span>{monthYearDisplay}</span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className={styles.navIconBtn}
                    aria-label="Next Month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Scrollable Days */}
              <div
                className={styles.daysGrid}
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  overflowX: "auto",
                  paddingBottom: "0.5rem",
                }}
              >
                {daysInCurrentMonth.map((item) => {
                  const isSelected = selectedDate === item.dateKey;
                  return (
                    <button
                      key={item.dateKey}
                      type="button"
                      disabled={item.isPast}
                      onClick={() => setSelectedDate(item.dateKey)}
                      style={{
                        minWidth: "3.2rem",
                        flexShrink: 0,
                        opacity: item.isPast ? 0.35 : 1,
                        cursor: item.isPast ? "not-allowed" : "pointer",
                      }}
                      className={`${styles.dateBtn} ${
                        isSelected ? styles.dateBtnActive : ""
                      }`}
                    >
                      <span className={styles.dayText}>{item.dayName}</span>
                      <span className={styles.dateNum}>{item.dayNum}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Slots Section */}
            <div>
              <span className={styles.subHeading}>Available Slots</span>
              {loadingSlots ? (
                <p className={styles.statusMessage}>
                  Slots load ho rahe hain...
                </p>
              ) : availableSlots.length === 0 ? (
                <p className={styles.statusMessage}>
                  Is date ke liye koi slot available nahi hai.
                </p>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map((item) => {
                    const isSelected = selectedSlot?.slotId === item.slotId;
                    return (
                      <button
                        key={item.slotId}
                        type="button"
                        onClick={() => setSelectedSlot(item)}
                        className={`${styles.slotBtn} ${
                          isSelected ? styles.slotBtnActive : ""
                        }`}
                      >
                        {item.displayTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {selectedDoctor && selectedSlot && (
            <div className={styles.infoNotice}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                Selected:{" "}
                <strong>
                  {selectedDate} ({selectedSlot.displayTime})
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Column 3: Appointment Details Form */}
        <div className={`${styles.card} ${styles.cardBetween}`}>
          <form onSubmit={handleBooking} className={styles.formFull}>
            <div>
              <h2 className={styles.sectionTitle}>3. Appointment Details</h2>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Consultation Type{" "}
                  <span className={styles.requiredMark}>*</span>
                </label>
                <div className={styles.typeCardsStack}>
                  <div
                    onClick={() => setConsultationType("VIDEO")}
                    className={`${styles.typeCard} ${
                      consultationType === "VIDEO" ? styles.typeCardActive : ""
                    }`}
                  >
                    <Video size={18} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        Video Consultation
                      </div>
                      <div className={styles.typeCardDesc}>
                        Consult from home
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setConsultationType("CLINIC")}
                    className={`${styles.typeCard} ${
                      consultationType === "CLINIC" ? styles.typeCardActive : ""
                    }`}
                  >
                    <Building2 size={18} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                        Clinic Visit
                      </div>
                      <div className={styles.typeCardDesc}>Visit at clinic</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label
                    className={styles.formLabel}
                    style={{ marginBottom: 0 }}
                  >
                    Reason / Symptoms{" "}
                    <span className={styles.requiredMark}>*</span>
                  </label>
                  <span className={styles.charCount}>
                    {symptoms.length}/300
                  </span>
                </div>
                <textarea
                  required
                  maxLength={300}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your symptoms or reason for consultation..."
                  className={`${styles.formTextarea} ${styles.textareaMedium}`}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <div className={styles.labelRow}>
                  <label
                    className={styles.formLabel}
                    style={{ marginBottom: 0 }}
                  >
                    Notes (Optional)
                  </label>
                  <span className={styles.charCount}>{notes.length}/300</span>
                </div>
                <textarea
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  className={`${styles.formTextarea} ${styles.textareaSmall}`}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setSymptoms("");
                  setNotes("");
                }}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? "Booking..." : "Book Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
