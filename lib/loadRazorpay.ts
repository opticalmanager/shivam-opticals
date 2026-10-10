/**
 * Precision Optics — Razorpay SDK Client Script Loader
 * 
 * Safely loads the Razorpay checkout script from checkout.razorpay.com into the DOM.
 * Ensures single injection and provides Promise-based resolution.
 */

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    // Check if script tag is already attached
    const existingScript = document.getElementById("razorpay-checkout-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.error("[Razorpay Loader] Failed to load checkout script from Razorpay CDN");
      resolve(false);
    };

    document.body.appendChild(script);
  });
}
