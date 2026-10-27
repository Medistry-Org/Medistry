"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Video,
  Calendar,
  Clock,
  MessageSquare,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import styles from "./AppointmentCard.module.css";

export interface AppointmentItem {
  AppointmentId?: number | string;
  id?: number | string;
  DoctorId?: number | string;
  doctorId?: number | string;
  DoctorName?: string;
  DoctorPhoto?: string;
  Specialization?: string;
  ExperienceYears?: number | string;
  Status?: string;
  ConsultationType?: string;
  Reason?: string;
  SlotDate?: string;
  StartTime?: string;
  EndTime?: string;
  BookedAt?: string;
}

interface AppointmentCardProps {
  appointment: AppointmentItem;
}

export default function AppointmentCard({ appointment }: AppointmentCardProps) {
  const router = useRouter();

  const appointmentId = appointment.AppointmentId ?? appointment.id;
  // Controller ko DoctorId chahiye:
  const doctorId = appointment.DoctorId ?? appointment.doctorId;
  const doctorName = appointment.DoctorName ?? "Consultant Doctor";
  const doctorPhoto = appointment.DoctorPhoto;
  const specialization = appointment.Specialization ?? "General Physician";
  const experience = appointment.ExperienceYears
    ? `${appointment.ExperienceYears} yrs exp`
    : null;
  const status = appointment.Status ?? "Booked";
  const slotDate = appointment.SlotDate ?? "Scheduled Date";
  const time =
    appointment.StartTime && appointment.EndTime
      ? `${appointment.StartTime} - ${appointment.EndTime}`
      : (appointment.StartTime ?? "Scheduled Time");
  const consultationType = appointment.ConsultationType ?? "Virtual";
  const reason = appointment.Reason;

  const isCompleted = status.toLowerCase() === "completed";
  const isCancelled = status.toLowerCase() === "cancelled";

  // Video call ke liye appointmentId jaati hai
  const handleJoinCall = () => {
    if (!appointmentId) return alert("Appointment ID nahi mili!");
    router.push(`/consultation/${appointmentId}`);
  };

  // Controller ke mutabiq chat room ke liye doctorId jaani chahiye
  const handleOpenChat = () => {
    if (!doctorId) {
      alert("Error: Is appointment me DoctorId available nahi hai!");
      return;
    }
    router.push(`/chat/${doctorId}`);
  };

  const getStatusClass = () => {
    if (isCompleted) return `${styles.statusBadge} ${styles.statusCompleted}`;
    if (isCancelled) return `${styles.statusBadge} ${styles.statusCancelled}`;
    return `${styles.statusBadge} ${styles.statusUpcoming}`;
  };

  return (
    <div className={styles.cardContainer}>
      {/* Top Header Row */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.appointmentBadge}>#{appointmentId}</span>
          <span className={getStatusClass()}>● {status}</span>
          <span className={styles.consultationType}>
            Type: {consultationType}
          </span>
        </div>

        {appointment.BookedAt && (
          <span className={styles.bookedAtText}>
            Booked on: {new Date(appointment.BookedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Middle Body */}
      <div className={styles.cardBody}>
        {/* Doctor Info */}
        <div className={styles.doctorSection}>
          <div className={styles.avatarContainer}>
            {doctorPhoto ? (
              <Image
                src={doctorPhoto}
                alt={doctorName}
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span className={styles.avatarFallback}>
                {doctorName.charAt(0)}
              </span>
            )}
          </div>
          <div className={styles.doctorDetails}>
            <h3 className={styles.doctorName}>{doctorName}</h3>
            <div className={styles.doctorMeta}>
              <span className={styles.specializationText}>
                <Stethoscope size={13} />
                {specialization}
              </span>
              {experience && <span>• {experience}</span>}
            </div>
          </div>
        </div>

        {/* Schedule Timing Pills */}
        <div className={styles.scheduleSection}>
          <div className={styles.pillItem}>
            <Calendar size={13} className={styles.pillIcon} />
            <span>{slotDate}</span>
          </div>
          <div className={styles.pillItem}>
            <Clock size={13} className={styles.pillIcon} />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Reason Box */}
      {reason && (
        <div className={styles.reasonBox}>
          <AlertCircle size={14} className={styles.reasonIcon} />
          <span className={styles.reasonText}>
            <strong>Reason:</strong> {reason}
          </span>
        </div>
      )}

      {/* Bottom Action Buttons */}
      <div className={styles.cardActions}>
        <button
          type="button"
          onClick={handleOpenChat}
          className={styles.chatButton}
        >
          <MessageSquare size={14} color="#2563eb" />
          Chat with Doctor
        </button>

        <button
          type="button"
          onClick={handleJoinCall}
          disabled={isCompleted || isCancelled}
          className={`${styles.videoButton} ${
            isCompleted || isCancelled ? styles.videoButtonDisabled : ""
          }`}
        >
          <Video size={14} />
          <span>
            {isCompleted
              ? "Call Finished"
              : isCancelled
                ? "Cancelled"
                : "Join Video Call"}
          </span>
        </button>
      </div>
    </div>
  );
}
