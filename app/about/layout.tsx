import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Heritage & Clinical Optical Lab",
  description:
    "Learn about Shivam Optical's legacy of precision ophthalmic dispensing, computerized eye testing, and clinical optical lab assembly in Mayur Vihar Phase I, Delhi.",
  alternates: {
    canonical: "https://shivamoptical.in/about",
  },
  openGraph: {
    title: "Our Heritage & Clinical Optical Lab | Shivam Optical",
    description:
      "Legacy of precision ophthalmic dispensing, computerized eye testing, and clinical optical lab assembly in Mayur Vihar, Delhi.",
    url: "https://shivamoptical.in/about",
    siteName: "Shivam Optical",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Heritage & Clinical Optical Lab | Shivam Optical",
    description:
      "Learn about Shivam Optical's legacy of precision ophthalmic dispensing in Delhi.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
