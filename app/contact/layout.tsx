import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Store Location (Mayur Vihar)",
  description:
    "Visit Shivam Optical at SAMACHAR Market, Kanishka Complex, Mayur Vihar Phase I Extension, Delhi 110091. Call or WhatsApp 097799 90207 for eye testing consultations.",
  alternates: {
    canonical: "https://shivamoptical.in/contact",
  },
  openGraph: {
    title: "Contact & Store Location | Shivam Optical Mayur Vihar",
    description:
      "Visit Shivam Optical at SAMACHAR Market, Mayur Vihar Phase I Extension, Delhi. Call/WhatsApp 097799 90207.",
    url: "https://shivamoptical.in/contact",
    siteName: "Shivam Optical",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact & Store Location | Shivam Optical Mayur Vihar",
    description:
      "Visit Shivam Optical at SAMACHAR Market, Mayur Vihar Phase I, Delhi.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
