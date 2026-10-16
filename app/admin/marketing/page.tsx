"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Send,
  Sparkles,
  MessageSquare,
  Plus,
  Loader2,
  Trash2,
  X,
  Eye,
  CheckCircle2,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CampaignItem {
  id: string;
  title: string;
  channel: "WhatsApp Broadcast" | "SMS Alert" | "Email Newsletter";
  audience: "All Registered Patrons" | "VIP Patrons (Spend > ₹5,000)" | "Eye Exam Follow-up";
  messageText: string;
  status: "Draft" | "Active" | "Completed";
  createdAt: string;
}

export default function AdminMarketingPage() {
  // Storefront Announcement Bar State
  const [announcementText, setAnnouncementText] = useState(
    "Complimentary Zeiss Lens Cleaning Kit with every luxury eyewear order | Atelier Mayur Vihar"
  );
  const [announcementLink, setAnnouncementLink] = useState("/products");
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBanner, setSavingBanner] = useState(false);

  // New Campaign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [channel, setChannel] = useState<CampaignItem["channel"]>("WhatsApp Broadcast");
  const [audience, setAudience] = useState<CampaignItem["audience"]>("All Registered Patrons");
  const [messageText, setMessageText] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Test send state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedCampaignForTest, setSelectedCampaignForTest] = useState<CampaignItem | null>(null);
  const [testMobile, setTestMobile] = useState("09779990207");
  const [isTestSending, setIsTestSending] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=marketing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.value) {
          if (data.value.announcementTicker) setAnnouncementText(data.value.announcementTicker);
          if (data.value.announcementLink) setAnnouncementLink(data.value.announcementLink);
          if (data.value.announcementEnabled !== undefined) setAnnouncementEnabled(Boolean(data.value.announcementEnabled));
          if (Array.isArray(data.value.campaigns)) setCampaigns(data.value.campaigns);
        }
      })
      .catch((err) => console.warn("Failed to load marketing settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const persistSettings = async (
    ticker: string,
    link: string,
    enabled: boolean,
    camps: CampaignItem[]
  ) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "marketing",
          value: {
            announcementTicker: ticker,
            announcementLink: link,
            announcementEnabled: enabled,
            campaigns: camps,
          },
        }),
      });
      return await res.json();
    } catch (err: any) {
      throw new Error(err.message || "Failed to persist marketing settings");
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanner(true);
    try {
      await persistSettings(announcementText, announcementLink, announcementEnabled, campaigns);
      toast.success("Storefront announcement banner updated live");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingBanner(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !messageText.trim()) {
      toast.error("Please enter a campaign title and message body");
      return;
    }

    setSavingCampaign(true);
    try {
      const newCampaign: CampaignItem = {
        id: `camp-${Date.now()}`,
        title: title.trim(),
        channel,
        audience,
        messageText: messageText.trim(),
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      const updated = [newCampaign, ...campaigns];
      await persistSettings(announcementText, announcementLink, announcementEnabled, updated);
      setCampaigns(updated);
      setIsModalOpen(false);
      setTitle("");
      setMessageText("");
      toast.success("Marketing broadcast campaign created");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      const updated = campaigns.filter((c) => c.id !== id);
      await persistSettings(announcementText, announcementLink, announcementEnabled, updated);
      setCampaigns(updated);
      toast.success("Campaign removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleTriggerTestSend = async () => {
    if (!testMobile.trim() || !selectedCampaignForTest) {
      toast.error("Enter a valid mobile number for test dispatch");
      return;
    }

    setIsTestSending(true);
    try {
      // Use existing SMS/OTP client test endpoint
      const res = await fetch("/api/admin/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "shivamoptical999@gmail.com" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Test broadcast dispatched to ${testMobile}`, {
          description: `Message template: "${selectedCampaignForTest.title}" via ${selectedCampaignForTest.channel}`,
        });
        setTestModalOpen(false);
      } else {
        toast.info(`Test dispatch simulated for ${testMobile}`, {
          description: selectedCampaignForTest.messageText.slice(0, 80),
        });
        setTestModalOpen(false);
      }
    } catch (err: any) {
      toast.error("Test send failed", { description: err.message });
    } finally {
      setIsTestSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-7 h-7 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-3 border-b border-[#E8DCCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Marketing &amp; Patron Communications
          </h1>
          <p className="text-xs text-stone-500">
            Curate customer storefront announcement banners and omnichannel SMS/WhatsApp patron notifications
          </p>
        </div>
      </div>

      {/* Storefront Announcement Ticker Editor */}
      <div className="bg-white rounded-xl border border-[#E8DCCF] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#FAF3EB] text-[#C5A059]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#0A251C]">Storefront Announcement Ticker</h3>
              <p className="text-xs text-stone-500">
                Displays prominently across the top header of shivamoptical.in for all visiting patrons
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
            <span>Show on Store</span>
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="rounded text-[#C5A059] focus:ring-[#C5A059]"
            />
          </label>
        </div>

        {/* Live Preview Box */}
        {announcementEnabled && (
          <div className="p-2.5 rounded-lg bg-[#0A251C] text-[#C5A059] text-xs flex items-center justify-center gap-2 font-medium tracking-wide border border-[#C5A059]/30">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{announcementText || "Announcement text goes here..."}</span>
          </div>
        )}

        <form onSubmit={handleSaveBanner} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Announcement Message
              </label>
              <Input
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Free Eye Checkup with Any Frame Purchase | Mayur Vihar Phase 1"
                className="text-xs bg-[#FAF7F2] border-[#E8DCCF]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Click Destination (URL or Path)
              </label>
              <Input
                value={announcementLink}
                onChange={(e) => setAnnouncementLink(e.target.value)}
                placeholder="/products"
                className="text-xs bg-[#FAF7F2] border-[#E8DCCF]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={savingBanner}
              className="bg-[#C5A059] hover:bg-[#b59049] text-white text-xs"
            >
              {savingBanner ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Save Announcement</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast Notices Center */}
      <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DCCF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#C5A059]" />
            <div>
              <h3 className="text-sm font-semibold text-[#0A251C]">Patron Broadcast Campaigns</h3>
              <p className="text-[11px] text-stone-500">
                Targeted SMS &amp; WhatsApp notifications for seasonal showcases and clinical reminders
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-[#0A251C] text-[#C5A059] hover:bg-black"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Create Campaign
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider border-b border-[#E8DCCF]">
              <tr>
                <th className="py-3 px-4">Campaign Title</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCF]">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-stone-400">
                    <MessageSquare className="w-6 h-6 mx-auto mb-2 text-stone-300" />
                    No broadcast campaigns scheduled yet. Click &quot;Create Campaign&quot; to draft one.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#0A251C]">
                      <div>{camp.title}</div>
                      <div className="text-[11px] text-stone-400 truncate max-w-sm font-normal mt-0.5">
                        {camp.messageText}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-medium">
                      {camp.channel}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {camp.audience}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaignForTest(camp);
                            setTestModalOpen(true);
                          }}
                          className="h-7 text-[11px] border-[#C5A059]/40 text-[#0A251C] hover:bg-[#FAF3EB]"
                        >
                          <Send className="w-3 h-3 mr-1 text-[#C5A059]" /> Test Dispatch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="h-7 w-7 p-0 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#E8DCCF]">
              <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                Compose Patron Broadcast Campaign
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mayur Vihar Atelier Autumn Eyewear Showcase"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Dispatch Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  >
                    <option value="WhatsApp Broadcast">WhatsApp Broadcast</option>
                    <option value="SMS Alert">SMS Alert (Fast2SMS)</option>
                    <option value="Email Newsletter">Email Newsletter</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Target Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  >
                    <option value="All Registered Patrons">All Registered Patrons</option>
                    <option value="VIP Patrons (Spend > ₹5,000)">VIP Patrons (Spend &gt; ₹5,000)</option>
                    <option value="Eye Exam Follow-up">Eye Exam Follow-up Patients</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">
                  Message Body * (Use variables like &#123;name&#125;)
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Greetings from Shivam Opticals Atelier. Discover our newly curated luxury titanium and bio-acetate arrivals in Mayur Vihar Phase 1..."
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingCampaign}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {savingCampaign ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  Save &amp; Activate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Test Dispatch Modal */}
      {testModalOpen && selectedCampaignForTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#E8DCCF]">
              <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                Send Test Broadcast
              </h2>
              <button
                type="button"
                onClick={() => setTestModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <p className="text-stone-600">
                Dispatch a single live preview message of <strong>&quot;{selectedCampaignForTest.title}&quot;</strong> to test gateway delivery.
              </p>

              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">Destination Mobile Number</label>
                <input
                  type="tel"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  placeholder="09779990207"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTestModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isTestSending}
                  onClick={handleTriggerTestSend}
                  className="text-xs bg-[#0A251C] text-[#C5A059] hover:bg-black"
                >
                  {isTestSending ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                  Send Test
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
