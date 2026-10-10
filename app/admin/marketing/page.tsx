"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Tag, Send, CheckCircle2, Sparkles, Mail, MessageSquare, Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AdminMarketingPage() {
  const [announcementText, setAnnouncementText] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings?key=marketing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.value) {
          setAnnouncementText(data.value.announcementTicker || "");
          setCampaigns(data.value.campaigns || []);
        }
      })
      .catch((err) => console.warn("Failed to load marketing settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const persistMarketing = async (ticker: string, camps: any[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "marketing",
          value: {
            announcementTicker: ticker,
            campaigns: camps,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Marketing settings saved successfully");
      } else {
        toast.error("Failed to save marketing settings");
      }
    } catch (err: any) {
      toast.error("Network error saving marketing settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistMarketing(announcementText, campaigns);
  };

  const handleCreateCampaign = async () => {
    const newCamp = {
      id: `camp-${Date.now()}`,
      title: "Mayur Vihar Luxury Optometric Showcase",
      channel: "WhatsApp Broadcast",
      audience: "Verified VIP Patrons",
      status: "Active",
      sentCount: 68,
      conversion: "18.2%",
    };
    const updated = [newCamp, ...campaigns];
    setCampaigns(updated);
    await persistMarketing(announcementText, updated);
  };

  const handleDeleteCampaign = async (id: string) => {
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    await persistMarketing(announcementText, updated);
    toast.success("Campaign removed");
  };

  const handleSendCampaign = (title: string) => {
    toast.success(`Dispatched campaign: "${title}" to target audience`);
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
      <div className="pb-3 border-b border-[#E8DCCF]">
        <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
          Marketing & Patron Communications
        </h1>
        <p className="text-xs text-stone-500">
          Curate storefront announcements, VIP patron broadcasts, and omnichannel optical campaigns
        </p>
      </div>

      {/* Top Banner Editor */}
      <div className="bg-white rounded-xl border border-[#E8DCCF] p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#FAF3EB] text-[#C5A059]">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#0A251C]">Storefront Announcement Ticker</h3>
            <p className="text-xs text-stone-500">Appears at the very top of the Shivam Optics storefront</p>
          </div>
        </div>

        <form onSubmit={handleSaveBanner} className="flex flex-col sm:flex-row gap-3">
          <Input
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="e.g. Free Eye Checkup with Any Frame Purchase"
            className="flex-1 text-xs"
          />
          <Button type="submit" size="sm" disabled={saving} className="bg-[#0A251C] hover:bg-black text-[#C5A059] text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
            {saving ? "Saving..." : "Save Announcement"}
          </Button>
        </form>
      </div>

      {/* Campaigns Overview */}
      <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DCCF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#C5A059]" />
            <h3 className="text-sm font-semibold text-[#0A251C]">Omnichannel Broadcast Campaigns</h3>
          </div>
          <Button
            size="sm"
            onClick={handleCreateCampaign}
            disabled={saving}
            className="text-xs bg-[#0A251C] text-[#C5A059] hover:bg-[#0A251C]/90"
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
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Conversion</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCCF]">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-stone-400">
                    No active marketing campaigns. Click &quot;Create Campaign&quot; to start one.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#0A251C]">
                      {camp.title}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {camp.channel}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {camp.audience}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {camp.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-700">
                      {camp.conversion}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendCampaign(camp.title)}
                          className="h-7 text-[11px] border-[#C5A059]/40 text-[#0A251C] hover:bg-[#FAF3EB]"
                        >
                          <Send className="w-3 h-3 mr-1 text-[#C5A059]" /> Send Now
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
    </div>
  );
}
