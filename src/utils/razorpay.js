// Razorpay Checkout runs from Razorpay's own script, loaded once, on demand (card / UPI details are
// entered on Razorpay's page, never in ours).
const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;

export const loadRazorpay = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay did not load.')));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Could not reach Razorpay. Check your connection and try again.'));
    };
    document.body.appendChild(script);
  });
  return loading;
};
