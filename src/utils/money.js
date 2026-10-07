const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
const inrWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

// Paise → "₹1,23,456.00" (Indian digit grouping). `whole` drops the paise: "₹1,23,456".
export const formatINR = (paise, { whole = false } = {}) => (whole ? inrWhole : inr).format((paise || 0) / 100);
