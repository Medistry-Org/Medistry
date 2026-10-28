/**
 * Saved addresses, used for home sample collection.
 *   GET    /api/address/my-addresses
 *   POST   /api/address/add   { addressLine, landmark, city, state, pincode, latitude, longitude, isPrimary }
 *   DELETE /api/address/:addressId
 */

import { apiRequest, listFrom } from "@/lib/http/apiClient";
import type { Address, NewAddress } from "@/types/address";

type RawAddress = {
  AddressId: number;
  AddressLine: string;
  Landmark?: string;
  City: string;
  State: string;
  Pincode: string;
  Latitude?: number | null;
  Longitude?: number | null;
  IsPrimary?: boolean;
};

const toAddress = (raw: RawAddress): Address => ({
  id: raw.AddressId,
  addressLine: raw.AddressLine,
  landmark: raw.Landmark ?? "",
  city: raw.City,
  state: raw.State,
  pincode: raw.Pincode,
  latitude: raw.Latitude ?? null,
  longitude: raw.Longitude ?? null,
  isPrimary: Boolean(raw.IsPrimary),
});

export async function listMyAddresses(): Promise<Address[]> {
  const body = await apiRequest("/api/address/my-addresses");
  return listFrom<RawAddress>(body).map(toAddress);
}

/** Returns the new address id when the backend sends it. */
export async function addAddress(address: NewAddress): Promise<number | null> {
  const body = await apiRequest<{ data?: { addressId?: number } }>("/api/address/add", { method: "POST", body: address });
  return body.data?.addressId ?? null;
}

export async function deleteAddress(addressId: number): Promise<void> {
  await apiRequest(`/api/address/${addressId}`, { method: "DELETE" });
}
