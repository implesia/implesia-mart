export type CheckoutShippingValues = {
  name: string;
  email: string;
  phone: string;
  district: string;
  area: string;
  address: string;
  notes: string;
};

export function validateShipping(shipping: CheckoutShippingValues) {
  const errors: Partial<Record<keyof CheckoutShippingValues, string>> = {};

  if (!shipping.name.trim()) errors.name = "নাম লিখুন";
  if (!/^01\d{9}$/.test(shipping.phone.trim())) {
    errors.phone = "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)";
  }
  if (shipping.email.trim()) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email.trim());
    if (!ok) errors.email = "সঠিক ইমেইল দিন";
  }
  if (!shipping.district.trim()) errors.district = "জেলা লিখুন";
  if (!shipping.area.trim()) errors.area = "এলাকা লিখুন";
  if (shipping.address.trim().length < 8) {
    errors.address = "সম্পূর্ণ ঠিকানা লিখুন";
  }

  return errors;
}
