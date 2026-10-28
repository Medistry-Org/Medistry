/** A saved home-collection address (GET /api/address/my-addresses). */
export type Address = {
  id: number;
  addressLine: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isPrimary: boolean;
};

/** POST /api/address/add body. */
export type NewAddress = Omit<Address, "id">;
