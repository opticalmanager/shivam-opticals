/**
 * Shivam Optical — Razorpay SDK Client Script Loader
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
    const existingScript = document.getElementById("razorpay-checkout-sdk") as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if ((window as any).Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (attempts > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
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
