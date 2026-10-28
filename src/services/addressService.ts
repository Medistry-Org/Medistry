/**
 * Saved home-collection addresses, used by the lab booking's address step. The address id from
 * this list is what the lab booking and slot lookups send as `addressId`.
 * Doc: docs/backend/lab-tests-redcliffe.md
 *   GET    /api/address/my-addresses   the patient's saved addresses, primary first or flagged
 *   POST   /api/address/add            saves one; 201 { data: { addressId } }; isPrimary replaces the old primary
 *   DELETE /api/address/:addressId     removes one
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import { newAddressProblem } from "@/lib/validation/labBookingRules";
import type { Address, NewAddress } from "@/types/address";

type RawAddress = {
  AddressId: number;
  AddressLine: string;
  Landmark?: string | null;
  City?: string | null;
  State?: string | null;
  Pincode: string;
  Latitude?: number | string | null;
  Longitude?: number | string | null;
  IsPrimary?: boolean | number;
};

/** Coordinates may arrive as numbers or numeric strings; anything else is "no map location". */
const coordinateOrNull = (value: RawAddress["Latitude"]) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toAddress = (raw: RawAddress): Address => ({
  id: Number(raw.AddressId),
  addressLine: raw.AddressLine ?? "",
  landmark: raw.Landmark ?? "",
  city: raw.City ?? "",
  state: raw.State ?? "",
  pincode: String(raw.Pincode ?? ""),
  latitude: coordinateOrNull(raw.Latitude),
  longitude: coordinateOrNull(raw.Longitude),
  isPrimary: Boolean(raw.IsPrimary),
});

export async function listMyAddresses(): Promise<Address[]> {
  const body = await apiRequest("/api/address/my-addresses");
  return listFrom<RawAddress>(body).map(toAddress);
}

/** Saves the address and returns its new id (null if the backend did not send one). */
export async function addAddress(address: NewAddress): Promise<number | null> {
  const problem = newAddressProblem(address);
  if (problem) throw new Error(problem);
  const body = await apiRequest<{ data?: { addressId?: number } }>(
    "/api/address/add",
    {
      method: "POST",
      body: {
        ...address,
        addressLine: address.addressLine.trim(),
        pincode: address.pincode.trim(),
      },
    },
  );
  return body.data?.addressId ?? null;
}

export async function deleteAddress(addressId: number): Promise<void> {
  if (!Number.isInteger(addressId) || addressId <= 0)
    throw new Error("This address cannot be removed.");
  await apiRequest(`/api/address/${addressId}`, { method: "DELETE" });
}
