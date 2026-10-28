"use client";

/**
 * The state of booking a home blood test, one decision per step: test, address, person, time,
 * then review and pay. Choosing again at any step drops a slot hold made from the old choices (the
 * backend cancels that hold when the next one is made).
 */

import { useState } from "react";
import { toApiDate } from "@/lib/format/dateTime";
import { createLabBooking } from "@/services/labTestService";
import type { Address } from "@/types/address";
import type { LabBooking, LabPackage, LabPatient } from "@/types/labTest";
import type { PatientProfile } from "@/types/patient";
import type { PickableSlot } from "@/components/ui/SlotPicker";

export const LAB_BOOKING_STEPS = ["package", "address", "patient", "time", "review"] as const;
export type LabBookingStep = (typeof LAB_BOOKING_STEPS)[number];

/** The person form before it is complete: the gender is chosen on the form. */
export type LabPatientDraft = Omit<LabPatient, "gender"> & { gender: LabPatient["gender"] | null };

/** The person form starts from the profile; Redcliffe needs a gender the profile does not hold. */
export function patientFromProfile(profile: PatientProfile | null, sessionMobile: string): LabPatientDraft {
  return {
    name: profile?.fullName ?? "",
    age: profile?.age ?? 0,
    gender: null,
    mobile: (profile?.phone || sessionMobile).replace(/\D/g, "").slice(-10),
    email: profile?.email ?? "",
  };
}

export function useLabBookingFlow() {
  const [step, setStep] = useState<LabBookingStep>("package");
  const [chosenPackage, setChosenPackage] = useState<LabPackage | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [patient, setPatient] = useState<LabPatient | null>(null);
  const [slot, setSlot] = useState<PickableSlot | null>(null);
  const [held, setHeld] = useState<LabBooking | null>(null);

  const stepNumber = LAB_BOOKING_STEPS.indexOf(step) + 1;

  /** Records a choice and moves to the next step. */
  const advance = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setHeld(null);
    setStep(LAB_BOOKING_STEPS[stepNumber]);
  };

  /** Holds the slot for 30 minutes (Redcliffe temporary booking). Returns the held booking. */
  const hold = async () => {
    if (!chosenPackage || !address || !patient || !slot) throw new Error("Finish every step first.");
    const booking = await createLabBooking({
      packageCode: chosenPackage.code,
      addressId: address.id,
      collectionDate: toApiDate(new Date(slot.at)),
      slotId: slot.id,
      patient,
    });
    setHeld(booking);
    return booking;
  };

  return {
    step,
    stepNumber,
    stepCount: LAB_BOOKING_STEPS.length,
    chosenPackage,
    address,
    patient,
    slot,
    held,
    choosePackage: advance(setChosenPackage),
    chooseAddress: advance(setAddress),
    savePatient: advance(setPatient),
    chooseSlot: advance(setSlot),
    goTo: setStep,
    back: () => setStep(LAB_BOOKING_STEPS[Math.max(0, stepNumber - 2)]),
    hold,
    releaseHold: () => setHeld(null),
  };
}

export type LabBookingFlow = ReturnType<typeof useLabBookingFlow>;
