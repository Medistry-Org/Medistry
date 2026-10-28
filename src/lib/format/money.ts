/** "₹1,999" or "₹499.50" in Indian digit grouping. Pass rupees (divide paise by 100 first). */
export const formatRupees = (rupees: number) =>
  `₹${rupees.toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2, maximumFractionDigits: 2 })}`;
