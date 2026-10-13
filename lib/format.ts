const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const toArabicDigits = (v: string | number): string =>
  String(v).replace(/\d/g, (d) => AR_DIGITS[Number(d)] ?? d);

export const formatPrice = (price: number | null): string =>
  price === null ? "السعر قريب" : `${toArabicDigits(price)} ج.م`;
