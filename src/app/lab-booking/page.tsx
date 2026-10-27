"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sun,
  Sunset,
  Moon,
  User,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  PlusCircle,
  Trash2,
} from "lucide-react";
import styles from "./LabBooking.module.css";
import { API_BASE_URL } from "@/config/env";

type PatientGender = "Male" | "Female" | "Other";

interface SlotItem {
  slotId: string;
  time: string;
  available: boolean;
}

interface SlotsResponse {
  morning: SlotItem[];
  afternoon: SlotItem[];
  evening: SlotItem[];
}

interface DateItem {
  id: string;
  day: string;
  date: string;
  fullIso: string;
}

interface AddressItem {
  AddressId: number;
  AddressLine: string;
  City: string;
  State: string;
  Pincode: string;
  Latitude?: number;
  Longitude?: number;
  IsPrimary?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  dates?: DateItem[];
  slots?: SlotsResponse;
  bookingId?: string;
}

interface LabBookingPageProps {
  testId?: number;
  totalAmount?: number;
}

export default function LabSlotBookingPage({
  testId = 101,
  totalAmount = 1999.0,
}: LabBookingPageProps) {
  // Address & Lab Data States
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [availableDates, setAvailableDates] = useState<DateItem[]>([]);
  const [slotsByShift, setSlotsByShift] = useState<SlotsResponse>({
    morning: [],
    afternoon: [],
    evening: [],
  });

  // Selected Booking Values
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  // Patient Info
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<PatientGender>("Male");
  const [phone, setPhone] = useState("");

  // New Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newLatitude, setNewLatitude] = useState<number>(28.5355);
  const [newLongitude, setNewLongitude] = useState<number>(77.391);
  const [isPrimaryAddress, setIsPrimaryAddress] = useState(true);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Status & Feedback States
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successBookingRef, setSuccessBookingRef] = useState<string | null>(
    null,
  );

  // Helper: Fetch Saved Addresses
  const fetchAddresses = async (token: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/address/my-addresses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result: ApiResponse<AddressItem[]> = await res.json();

      if (result.success && Array.isArray(result.data)) {
        setAddresses(result.data);
        if (result.data.length > 0) {
          // Primary address select karo agar available ho
          const primary =
            result.data.find((a) => a.IsPrimary) || result.data[0];
          setSelectedAddressId(primary.AddressId);
        }
      }
    } catch (err: unknown) {
      console.error("[LabBooking] Address fetch error:", err);
    }
  };

  // 1. Initial Data Fetch (Addresses + Dates)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsPageLoading(true);
        setErrorMsg("");

        const token = localStorage.getItem("token") || "";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [addressRes, datesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/address/my-addresses`, { headers }),
          fetch(`${API_BASE_URL}/api/labs/available-dates?testId=${testId}`, {
            headers,
          }),
        ]);

        const addressResult: ApiResponse<AddressItem[]> =
          await addressRes.json();
        const datesResult: ApiResponse<DateItem[]> = await datesRes.json();

        if (addressResult.success && Array.isArray(addressResult.data)) {
          setAddresses(addressResult.data);
          if (addressResult.data.length > 0) {
            const primary =
              addressResult.data.find((a) => a.IsPrimary) ||
              addressResult.data[0];
            setSelectedAddressId(primary.AddressId);
          }
        }

        if (
          datesResult.success &&
          datesResult.dates &&
          datesResult.dates.length > 0
        ) {
          setAvailableDates(datesResult.dates);
          setSelectedDate(datesResult.dates[0].fullIso);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load booking schedule.";
        console.error("[LabBooking] Initial fetch error:", message);
        setErrorMsg("Failed to load booking data. Please try again.");
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchInitialData();
  }, [testId]);

  // 2. Fetch Slots on Date or Address Change
  useEffect(() => {
    if (!selectedDate || !selectedAddressId) return;

    const fetchSlots = async () => {
      try {
        setIsSlotsLoading(true);
        setSelectedSlot("");

        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${API_BASE_URL}/api/labs/slots?testId=${testId}&addressId=${selectedAddressId}&date=${selectedDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data: ApiResponse<SlotsResponse> = await res.json();
        if (data.success && data.slots) {
          setSlotsByShift(data.slots);
        } else {
          setSlotsByShift({ morning: [], afternoon: [], evening: [] });
        }
      } catch (err: unknown) {
        console.error("[LabBooking] Slots fetch error:", err);
        setErrorMsg("Failed to load time slots for this date.");
      } finally {
        setIsSlotsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedAddressId, testId]);

  // 3. Add New Address Handler
  const handleAddNewAddress = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newAddressLine.trim() || !newPincode.trim()) {
      setErrorMsg("Address Line and Pincode are required.");
      return;
    }

    try {
      setIsSavingAddress(true);
      const token = localStorage.getItem("token") || "";

      const payload = {
        addressLine: newAddressLine.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        pincode: newPincode.trim(),
        latitude: newLatitude,
        longitude: newLongitude,
        isPrimary: isPrimaryAddress,
      };

      const res = await fetch(`${API_BASE_URL}/api/address/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to save address.");
      }

      // Fresh list reload karo
      await fetchAddresses(token);
      if (result.data?.addressId) {
        setSelectedAddressId(result.data.addressId);
      }

      // Reset address form
      setNewAddressLine("");
      setNewCity("");
      setNewState("");
      setNewPincode("");
      setShowAddressForm(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add address.";
      setErrorMsg(message);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // 4. Delete Address Handler
  const handleDeleteAddress = async (idToDelete: number) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/api/address/${idToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete address.");
      }

      await fetchAddresses(token);
      if (selectedAddressId === idToDelete) {
        setSelectedAddressId(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete address.";
      setErrorMsg(message);
    }
  };

  // 5. Final Lab Test Booking Submission
  const handleBookingConfirm = async () => {
    setErrorMsg("");

    if (!selectedAddressId) {
      setErrorMsg("Please select or add a collection address.");
      return;
    }

    if (!selectedDate) {
      setErrorMsg("Please select a sample collection date.");
      return;
    }

    if (!selectedSlot) {
      setErrorMsg("Please select an available collection time slot.");
      return;
    }

    if (!patientName.trim()) {
      setErrorMsg("Please provide patient full name.");
      return;
    }

    if (!age || Number(age) <= 0 || Number(age) > 120) {
      setErrorMsg("Please provide a valid patient age.");
      return;
    }

    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg("Please provide a valid 10-digit contact number.");
      return;
    }

    const payload = {
      testId,
      addressId: selectedAddressId,
      date: selectedDate,
      slotId: selectedSlot,
      patientName: patientName.trim(),
      age: Number(age),
      gender,
      phone: phone.trim(),
      totalAmount,
    };

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("token") || "";

      const res = await fetch(`${API_BASE_URL}/api/labs/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse<never> = await res.json();

      if (!res.ok || !data.success || !data.bookingId) {
        throw new Error(data.message || "Failed to confirm lab appointment.");
      }

      setSuccessBookingRef(data.bookingId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      console.error("[LabBooking] Submission error:", message);
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenderChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setGender(e.target.value as PatientGender);
  };

  if (successBookingRef) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.successCard}>
          <CheckCircle2 size={56} className={styles.successIcon} />
          <h2>Booking Confirmed!</h2>
          <p>
            Your diagnostic test sample collection has been booked successfully.
          </p>
          <div className={styles.refBox}>
            <span>Booking Reference ID:</span>
            <strong>{successBookingRef}</strong>
          </div>
          <p className={styles.subtext}>
            Phlebotomist sample lene scheduled date aur slot par pahuchega.
            Status webhook ke through live track hota rahega.
          </p>
        </div>
      </main>
    );
  }

  if (isPageLoading) {
    return (
      <main className={styles.pageContainer}>
        <div className={styles.loadingWrapper}>
          <Loader2 size={36} className={styles.spinner} />
          <p>Loading booking schedule and addresses...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <header className={styles.headerSection}>
          <h1 className={styles.pageTitle}>Book Home Sample Collection</h1>
          <p className={styles.pageSubtitle}>
            Certified phlebotomist will visit your selected address for
            diagnostic tests.
          </p>
        </header>

        {errorMsg && (
          <div className={styles.errorAlert} role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <section className={styles.bookingCard}>
          {/* STEP 1: ADDRESS SELECTION & ADD NEW ADDRESS FORM */}
          <div className={styles.formGroup}>
            <div className={styles.headerActionRow}>
              <h3 className={styles.sectionHeading}>
                <MapPin size={18} />
                <span>1. Sample Collection Address</span>
              </h3>
              <button
                type="button"
                className={styles.addAddressToggleBtn}
                onClick={() => setShowAddressForm((prev) => !prev)}
              >
                <PlusCircle size={15} />
                <span>{showAddressForm ? "Cancel" : "Add New Address"}</span>
              </button>
            </div>

            {/* Inline Add Address Form */}
            {showAddressForm && (
              <form
                onSubmit={handleAddNewAddress}
                className={styles.newAddressForm}
              >
                <div className={styles.field}>
                  <label>Address Line *</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Tower B, Supertech"
                    value={newAddressLine}
                    onChange={(e) => setNewAddressLine(e.target.value)}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.field}>
                    <label>City</label>
                    <input
                      type="text"
                      placeholder="e.g. Noida"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>State</label>
                    <input
                      type="text"
                      placeholder="e.g. Uttar Pradesh"
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.inputGrid}>
                  <div className={styles.field}>
                    <label>Pincode *</label>
                    <input
                      type="text"
                      placeholder="e.g. 201306"
                      maxLength={6}
                      value={newPincode}
                      onChange={(e) =>
                        setNewPincode(e.target.value.replace(/\D/g, ""))
                      }
                      className={styles.input}
                      required
                    />
                  </div>
                  <div className={styles.checkboxField}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={isPrimaryAddress}
                        onChange={(e) => setIsPrimaryAddress(e.target.checked)}
                      />
                      <span>Set as primary default address</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className={styles.saveAddressBtn}
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 size={15} className={styles.spinner} />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <span>Save & Select Address</span>
                  )}
                </button>
              </form>
            )}

            {/* Saved Addresses Radio List */}
            {addresses.length === 0 ? (
              <p className={styles.emptyNotice}>
                No saved address found. Click "Add New Address" above to
                continue.
              </p>
            ) : (
              <div className={styles.addressList}>
                {addresses.map((addr) => (
                  <div
                    key={addr.AddressId}
                    className={`${styles.addressItem} ${
                      selectedAddressId === addr.AddressId
                        ? styles.addressItemActive
                        : ""
                    }`}
                  >
                    <label className={styles.addressSelectArea}>
                      <input
                        type="radio"
                        name="labAddressSelect"
                        checked={selectedAddressId === addr.AddressId}
                        onChange={() => setSelectedAddressId(addr.AddressId)}
                      />
                      <div>
                        <div className={styles.addressTitleRow}>
                          <strong>
                            {addr.City || "Address"}{" "}
                            {addr.IsPrimary && (
                              <span className={styles.primaryTag}>Primary</span>
                            )}
                          </strong>
                        </div>
                        <p>
                          {addr.AddressLine}, {addr.City} - {addr.Pincode}
                        </p>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.AddressId)}
                      className={styles.deleteAddressBtn}
                      title="Delete this address"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: PATIENT DETAILS */}
          <div className={styles.formGroup}>
            <h3 className={styles.sectionHeading}>
              <User size={18} />
              <span>2. Patient Information</span>
            </h3>

            <div className={styles.inputGrid}>
              <div className={styles.field}>
                <label htmlFor="patientName">Full Name *</label>
                <input
                  id="patientName"
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="patientAge">Age *</label>
                <input
                  id="patientAge"
                  type="number"
                  placeholder="e.g. 30"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) =>
                    setAge(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="patientGender">Gender *</label>
                <select
                  id="patientGender"
                  value={gender}
                  onChange={handleGenderChange}
                  className={styles.input}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="patientPhone">Mobile Number *</label>
                <div className={styles.phoneInputWrap}>
                  <Phone size={14} className={styles.phoneIcon} />
                  <input
                    id="patientPhone"
                    type="tel"
                    placeholder="10-digit number"
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    className={`${styles.input} ${styles.inputWithIcon}`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: DATE PICKER */}
          <div className={styles.formGroup}>
            <h3 className={styles.sectionHeading}>
              <Calendar size={18} />
              <span>3. Collection Date</span>
            </h3>

            {availableDates.length === 0 ? (
              <p className={styles.emptyNotice}>No available dates found.</p>
            ) : (
              <div className={styles.dateScroll}>
                {availableDates.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedDate(item.fullIso)}
                    className={`${styles.datePill} ${
                      selectedDate === item.fullIso ? styles.datePillActive : ""
                    }`}
                  >
                    <span className={styles.dayText}>{item.day}</span>
                    <span className={styles.dateNum}>
                      {item.date.split(" ")[0]}
                    </span>
                    <span className={styles.dayText}>
                      {item.date.split(" ")[1]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* STEP 4: TIME SLOT PARTITIONS */}
          <div className={styles.formGroup}>
            <h3 className={styles.sectionHeading}>
              <Clock size={18} />
              <span>4. Time Slot Window</span>
            </h3>

            {isSlotsLoading ? (
              <div className={styles.slotLoader}>
                <Loader2 size={18} className={styles.spinner} />
                <span>Finding available slots for this date & address...</span>
              </div>
            ) : (
              <>
                {slotsByShift.morning?.length > 0 && (
                  <div className={styles.shiftBlock}>
                    <div className={styles.shiftHeader}>
                      <Sun size={15} />
                      <span>Morning (Ideal for Fasting Blood Tests)</span>
                    </div>
                    <div className={styles.slotsGrid}>
                      {slotsByShift.morning.map((slot) => (
                        <button
                          key={slot.slotId || slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`${styles.slotBtn} ${
                            !slot.available ? styles.slotBtnDisabled : ""
                          } ${selectedSlot === slot.time ? styles.slotBtnActive : ""}`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {slotsByShift.afternoon?.length > 0 && (
                  <div className={styles.shiftBlock}>
                    <div className={styles.shiftHeader}>
                      <Sunset size={15} />
                      <span>Afternoon</span>
                    </div>
                    <div className={styles.slotsGrid}>
                      {slotsByShift.afternoon.map((slot) => (
                        <button
                          key={slot.slotId || slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`${styles.slotBtn} ${
                            !slot.available ? styles.slotBtnDisabled : ""
                          } ${selectedSlot === slot.time ? styles.slotBtnActive : ""}`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {slotsByShift.evening?.length > 0 && (
                  <div className={styles.shiftBlock}>
                    <div className={styles.shiftHeader}>
                      <Moon size={15} />
                      <span>Evening</span>
                    </div>
                    <div className={styles.slotsGrid}>
                      {slotsByShift.evening.map((slot) => (
                        <button
                          key={slot.slotId || slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setSelectedSlot(slot.time)}
                          className={`${styles.slotBtn} ${
                            !slot.available ? styles.slotBtnDisabled : ""
                          } ${selectedSlot === slot.time ? styles.slotBtnActive : ""}`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {slotsByShift.morning?.length === 0 &&
                  slotsByShift.afternoon?.length === 0 &&
                  slotsByShift.evening?.length === 0 && (
                    <p className={styles.emptyNotice}>
                      No available slot found for this selected address/date.
                    </p>
                  )}
              </>
            )}
          </div>

          {/* STEP 5: BOOKING SUMMARY */}
          <div className={styles.summaryBox}>
            <div className={styles.summaryRow}>
              <span>Address ID:</span>
              <strong>
                {selectedAddressId ? `#${selectedAddressId}` : "Not Selected"}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Scheduled Date & Slot:</span>
              <strong>
                {selectedDate || "—"} | {selectedSlot || "Pending"}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Patient:</span>
              <strong>
                {patientName || "—"} {age ? `(${age} Yrs, ${gender})` : ""}
              </strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Payable:</span>
              <strong className={styles.priceHighlight}>
                ₹{totalAmount.toFixed(2)}
              </strong>
            </div>
          </div>

          {/* CONFIRM BUTTON */}
          <button
            type="button"
            onClick={handleBookingConfirm}
            disabled={isSubmitting || !selectedSlot || !selectedAddressId}
            className={styles.confirmBtn}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className={styles.spinner} />
                <span>Confirming via Lab Adapter...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Confirm Lab Booking</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </section>
      </div>
    </main>
  );
}
