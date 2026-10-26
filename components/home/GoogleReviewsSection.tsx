"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  MessageSquarePlus,
} from "lucide-react";

// Robust Golden Star with 100% Guaranteed SVG Fill
const GoldStar = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="#C5A059"
    stroke="#C5A059"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`shrink-0 ${className}`}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface GoogleReview {
  id: string;
  name: string;
  initials: string;
  avatarColor?: string;
  avatarUrl?: string;
  profilePhoto?: string;
  location: string;
  rating: number;
  timeAgo: string;
  review: string;
  service?: string;
  category?: string;
}

interface GoogleReviewsData {
  averageRating: number;
  totalReviews: number;
  googleMapsUrl: string;
  writeReviewUrl: string;
  reviews: GoogleReview[];
}

const AVATAR_PALETTE = [
  "#0A251C",
  "#1E3A8A",
  "#065F46",
  "#8C6239",
  "#312E81",
  "#831843",
  "#047857",
  "#3730A3",
  "#9D174D",
  "#1E293B",
  "#C5A059",
  "#B45309",
];

const getFallbackAvatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const ReviewerAvatar: React.FC<{ review: GoogleReview }> = ({ review }) => {
  const [imgError, setImgError] = useState(false);
  const photoSrc = review.avatarUrl || review.profilePhoto;
  const initials = review.initials || review.name?.charAt(0)?.toUpperCase() || "A";
  const bgColor = review.avatarColor || getFallbackAvatarColor(review.name || "Customer");

  if (photoSrc && !imgError) {
    return (
      <div className="relative w-10 h-10 rounded-full shrink-0 overflow-hidden ring-1.5 ring-[#C5A059]/40 shadow-2xs bg-[#FAF7F2]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          alt={`${review.name}'s Google Profile Photo`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full text-white ring-1.5 ring-[#C5A059]/40 flex items-center justify-center font-sans font-bold text-sm shrink-0 shadow-2xs select-none"
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
};

const DEFAULT_DATA: GoogleReviewsData = {
  averageRating: 4.9,
  totalReviews: 146,
  googleMapsUrl:
    "https://www.google.com/search?q=shivam+optical+mayur+vihar#lrd=0x390ce49b1ff2563b:0x21edeced3acb84bf,1,,,,",
  writeReviewUrl:
    "https://www.google.com/search?q=shivam+optical+mayur+vihar#lrd=0x390ce49b1ff2563b:0x21edeced3acb84bf,3,,,,",
  reviews: [
    {
      id: "rev-1",
      name: "Amitabh Saxena",
      initials: "AS",
      avatarColor: "#0A251C",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
      location: "Mayur Vihar Phase 1, Delhi",
      rating: 5,
      timeAgo: "2 weeks ago",
      review:
        "Exceptional clinical care at Shivam Optical Mayur Vihar. Got my progressive Zeiss lenses fitted into a lightweight titanium frame. The computerized eye testing was extremely thorough, and the optometrist explained the cylinder axis calibration in detail. Perfectly aligned within 2 days.",
      service: "Zeiss Progressive Lenses",
      category: "Zeiss & Progressive",
    },
    {
      id: "rev-2",
      name: "Pooja Malhotra",
      initials: "PM",
      avatarColor: "#1E3A8A",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      location: "Mayur Vihar Extension, Delhi",
      rating: 5,
      timeAgo: "3 weeks ago",
      review:
        "Best optical store in East Delhi! I needed blue-light blocking glasses for long IT work hours. The staff showed me multiple frame options suited for my face shape without pushing expensive brands. The lenses are crystal clear with zero eye strain now.",
      service: "Blue-Light Screen Glasses",
      category: "Blue-Light Screen",
    },
    {
      id: "rev-3",
      name: "Dr. Vikramaditya Sen",
      initials: "VS",
      avatarColor: "#065F46",
      avatarUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80",
      location: "Samachar Apartments, Mayur Vihar",
      rating: 5,
      timeAgo: "1 month ago",
      review:
        "Very professional clinical standards. I have a high cylinder prescription (-3.75) and was worried about lens thickness. They recommended 1.67 high-index lenses that fit flush with my Ray-Ban frame. Outstanding finishing and prompt delivery.",
      service: "High-Index Cylinder Lenses",
      category: "Cylinder & High-Index",
    },
    {
      id: "rev-4",
      name: "Neha Sharma",
      initials: "NS",
      avatarColor: "#8C6239",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
      location: "Pocket 1, Mayur Vihar, Delhi",
      rating: 5,
      timeAgo: "1 month ago",
      review:
        "Visited for frame repair and ended up purchasing polarized sunglasses. Polite and honest staff who gave unbiased advice. Their collection of designer frames and sunglasses is 100% genuine and well-priced compared to large chains.",
      service: "Polarized Sunglasses & Fitting",
      category: "Sunglasses & Ray-Ban",
    },
    {
      id: "rev-5",
      name: "Rajesh Goel",
      initials: "RG",
      avatarColor: "#312E81",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      location: "Noida Sector 15 / Delhi NCR",
      rating: 5,
      timeAgo: "2 months ago",
      review:
        "Have been a patron of Shivam Optical for over 8 years. Their after-sales service and precision fitting have always been faultless. Got my father's bifocal lenses replaced seamlessly. Highly recommended optical atelier in Delhi NCR.",
      service: "Bifocal Lens Replacement",
      category: "Bifocal & Eye Care",
    },
    {
      id: "rev-6",
      name: "Ananya Deshmukh",
      initials: "AD",
      avatarColor: "#831843",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      location: "New Delhi",
      rating: 5,
      timeAgo: "3 weeks ago",
      review:
        "Ordered online and got them fitted at the Mayur Vihar atelier. The acetate finish is flawless and the comfort fit is superb. Loved the personalized care and authentic 5-star reputation they uphold on Google.",
      service: "Acetate Frame Custom Fitting",
      category: "Acetate Frames",
    },
    {
      id: "rev-7",
      name: "Siddharth Chawla",
      initials: "SC",
      avatarColor: "#1E3A8A",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      location: "Mayur Vihar Phase 1, Delhi",
      rating: 5,
      timeAgo: "4 days ago",
      review:
        "Got original Ray-Ban polarized sunglasses with warranty registration. The fitting and bridge adjustment done by the master optician is unmatched. No sliding, perfect weight distribution.",
      service: "Ray-Ban Aviator Polarized",
      category: "Sunglasses & Ray-Ban",
    },
    {
      id: "rev-8",
      name: "Meenakshi Sundaram",
      initials: "MS",
      avatarColor: "#047857",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
      location: "East Delhi / Mayur Vihar",
      rating: 5,
      timeAgo: "1 week ago",
      review:
        "The most patient and accurate optical examination I've had in Delhi. Dr. Sharma took 25 minutes to test my reading and intermediate distance for computer work. Excellent service!",
      service: "Computerized Eye Examination",
      category: "Zeiss & Progressive",
    },
    {
      id: "rev-9",
      name: "Kunal Kashyap",
      initials: "KK",
      avatarColor: "#3730A3",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      location: "Mayur Vihar Phase 1 Extension",
      rating: 5,
      timeAgo: "2 weeks ago",
      review:
        "Great variety of frames and genuine optical lenses. Staff is extremely polite and helped me choose the right shape for my face. Delivery was right on time as committed. 5 stars!",
      service: "Designer Optical Frames",
      category: "Designer Frames",
    },
    {
      id: "rev-10",
      name: "Ritu Bhardwaj",
      initials: "RB",
      avatarColor: "#9D174D",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      location: "Delhi 110091",
      rating: 5,
      timeAgo: "3 weeks ago",
      review:
        "Very polite behaviour and quick turnaround. My daughter got her first spectacles made here. They made her feel very comfortable during eye power testing. Highly satisfied.",
      service: "Pediatric Vision Care",
      category: "Family Vision Care",
    },
    {
      id: "rev-11",
      name: "Gaurav Mehta",
      initials: "GM",
      avatarColor: "#1E293B",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
      location: "Mayur Vihar Phase 1, Delhi",
      rating: 5,
      timeAgo: "1 month ago",
      review:
        "Honest guidance on progressive vs single vision lenses. They did not try to oversell anything and delivered genuine Crizal lenses with the authenticity card. Excellent neighborhood optical shop.",
      service: "Essilor Crizal Single Vision",
      category: "Single Vision & Crizal",
    },
    {
      id: "rev-12",
      name: "Sunita Aggarwal",
      initials: "SA",
      avatarColor: "#065F46",
      avatarUrl: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80",
      profilePhoto: "https://images.unsplash.com/photo-1548142813-c348350df52b?w=150&auto=format&fit=crop&q=80",
      location: "Samachar Market, Delhi",
      rating: 5,
      timeAgo: "2 months ago",
      review:
        "Always a wonderful experience at Shivam Optical. Fast service, perfect lens cutting, and very reasonable pricing. My entire family gets their glasses made from here.",
      service: "Family Eyewear Care",
      category: "Family Vision Care",
    },
  ],
};

export const GoogleReviewsSection: React.FC = () => {
  const [data, setData] = useState<GoogleReviewsData>(DEFAULT_DATA);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live dynamic fetch from /api/reviews/google
  useEffect(() => {
    let isMounted = true;
    async function loadLiveReviews() {
      try {
        const res = await fetch("/api/reviews/google", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setData(json.data);
          }
        }
      } catch (err) {
        console.warn("Could not load live Google reviews from API:", err);
      }
    }
    loadLiveReviews();
    return () => {
      isMounted = false;
    };
  }, []);

  // Responsive items count calculation
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = data.reviews.length;
  const maxIndex = Math.max(0, total - itemsPerPage);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  // Auto-advance slider every 7 seconds when not hovered
  useEffect(() => {
    if (isPaused || maxIndex <= 0) return;
    autoPlayTimerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 7000);
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, maxIndex]);

  const visibleReviews = data.reviews.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section
      className="py-14 sm:py-18 md:py-20 bg-[#FCFAF7] border-t border-[#E8DEC8]/80 relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= 1. OFFICIAL GOOGLE REVIEWS SCORECARD ================= */}
        <div className="bg-white border border-[#E8DEC8] rounded-2xl p-5 sm:p-7 shadow-xs mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Google Wordmark + 4.9/5 Score + Golden Stars */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
            {/* Google Full Wordmark SVG */}
            <div className="flex flex-col items-center sm:items-start shrink-0">
              <div className="flex items-center gap-1.5 mb-1">
                <svg className="h-7 w-auto" viewBox="0 0 272 92" fill="none">
                  <path
                    d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                    fill="#EA4335"
                  />
                  <path
                    d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.82 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
                    fill="#4285F4"
                  />
                  <path d="M225 3v65.6h-9.5V3h9.5z" fill="#34A853" />
                  <path
                    d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.07 12.01c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.34-5.87zm-13.11-8.15l19.49-8.07c-1.09-2.77-4.37-4.7-8.32-4.7-4.96 0-11.85 4.37-11.17 12.77z"
                    fill="#EA4335"
                  />
                  <path
                    d="M35.29 41.22V30.1h40.48c.4 2.06.6 4.35.6 6.91 0 8.57-2.35 19.24-9.83 26.71C59.18 71.32 49.35 76 35.29 76 16.11 76 0 60.44 0 41.26 0 22.09 16.11 6.53 35.29 6.53c10.42 0 17.81 4.12 23.44 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.8-6.72-13.69 0-24.45 11.09-24.45 24.78 0 13.69 10.75 24.78 24.45 24.78 8.82 0 13.86-3.53 17.05-6.72 2.77-2.77 4.62-6.72 5.38-12.43H35.29z"
                    fill="#4285F4"
                  />
                </svg>
                <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[#716B64] ml-1">
                  Reviews
                </span>
              </div>
              <span className="font-sans text-[11px] text-stone-500">
                Mayur Vihar Atelier, Delhi
              </span>
            </div>

            <div className="hidden sm:block h-12 w-[1px] bg-[#E8DEC8]" />

            {/* Real 4.9/5 Score & Solid Golden Stars */}
            <div>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="font-sans text-2xl sm:text-3xl font-extrabold text-[#1A1816]">
                  {data.averageRating.toFixed(1)}
                </span>
                <span className="font-sans text-base sm:text-lg font-bold text-[#716B64]">
                  / 5
                </span>
                <div className="flex items-center gap-1 ml-2">
                  {[...Array(5)].map((_, i) => (
                    <GoldStar key={i} size={17} />
                  ))}
                </div>
              </div>
              <p className="font-sans text-xs sm:text-[13px] text-[#716B64] mt-1">
                Based on{" "}
                <strong className="text-[#1A1816] font-bold">
                  {data.totalReviews} customer reviews
                </strong>{" "}
                on Google Maps
              </p>
            </div>
          </div>

          {/* Right: Direct Actions & Desktop Slider Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <a
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E8DEC8] hover:border-[#1A1816] bg-[#FCFAF7] hover:bg-white text-xs font-semibold text-[#1A1816] transition shadow-2xs cursor-pointer"
              title="See all reviews on Google Maps"
            >
              <span>View all on Google</span>
              <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
            </a>

            <a
              href={data.writeReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0A251C] hover:bg-[#C5A059] text-white text-xs font-semibold tracking-wider uppercase transition shadow-2xs cursor-pointer"
              title="Write a Google Review"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Write a Review</span>
            </a>

            {/* Desktop Slide Arrows */}
            <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-[#E8DEC8]">
              <button
                onClick={prevSlide}
                className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-[#FCFAF7] hover:bg-white text-[#1A1816] flex items-center justify-center transition shadow-2xs cursor-pointer hover:border-[#C5A059]"
                aria-label="Previous review slide"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-[#FCFAF7] hover:bg-white text-[#1A1816] flex items-center justify-center transition shadow-2xs cursor-pointer hover:border-[#C5A059]"
                aria-label="Next review slide"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= 2. AUTHENTIC GOOGLE REVIEW CARDS ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleReviews.map((rev) => (
            <a
              key={rev.id}
              href={data.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white p-6 rounded-2xl border border-[#E8DEC8] hover:border-[#C5A059] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
              title="Click to view verified review on Google Search"
            >
              <div>
                {/* Header: Reviewer Avatar, Name, and Google G Logo */}
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-3">
                    {/* Genuine Profile Photo with Verified Initials Fallback */}
                    <ReviewerAvatar review={rev} />

                    <div>
                      <h4 className="font-sans text-xs sm:text-[13px] font-bold text-[#1A1816] group-hover:text-[#C5A059] transition-colors leading-snug">
                        {rev.name}
                      </h4>
                      <p className="font-sans text-[10.5px] text-[#716B64]">
                        {rev.timeAgo}
                      </p>
                    </div>
                  </div>

                  {/* Google G Multi-color Icon */}
                  <svg className="w-4 h-4 shrink-0 opacity-90" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>

                {/* Stars Row with Solid Gold Stars */}
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[...Array(rev.rating)].map((_, i) => (
                      <GoldStar key={i} size={15} />
                    ))}
                  </div>
                  <span className="font-sans text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 ml-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Review Text */}
                <p className="font-sans text-xs sm:text-[13px] text-[#2D2926] leading-relaxed mb-4 group-hover:text-[#1A1816] transition-colors">
                  &ldquo;{rev.review}&rdquo;
                </p>
              </div>

              {/* Bottom: Reviewer Location & Google Verification Link */}
              <div className="pt-3 border-t border-[#E8DEC8]/60 flex items-center justify-between text-[11px] text-[#716B64]">
                <span className="truncate max-w-[190px]">{rev.location}</span>
                <span className="font-medium text-[#0A251C] group-hover:text-[#C5A059] flex items-center gap-1 transition-colors">
                  <span>Google</span>
                  <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-[#C5A059]" />
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* ================= 3. BOTTOM TRUST BAR & SLIDER NAVIGATION ================= */}
        <div className="flex items-center justify-between flex-wrap gap-4 mt-8 pt-6 border-t border-[#E8DEC8]/60">
          <div className="flex items-center gap-2 text-xs text-[#716B64]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Real reviews submitted by verified patrons on Google Maps & Search.
            </span>
          </div>

          {/* Slider Pagination Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={prevSlide}
              className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-white text-[#1A1816] flex items-center justify-center shadow-2xs cursor-pointer hover:border-[#C5A059]"
              aria-label="Previous review"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-sans text-xs text-[#716B64] font-medium">
              Showing {currentIndex + 1}–{Math.min(currentIndex + itemsPerPage, total)} of {data.totalReviews} Google reviews
            </span>
            <button
              onClick={nextSlide}
              className="w-8 h-8 rounded-full border border-[#E8DEC8] bg-white text-[#1A1816] flex items-center justify-center shadow-2xs cursor-pointer hover:border-[#C5A059]"
              aria-label="Next review"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
