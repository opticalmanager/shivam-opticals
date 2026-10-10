"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, XCircle, Loader2, UserCheck, Phone, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";
import { StoredAppointment } from "@/lib/adminDb";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<StoredAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/appointments");
      const data = await res.json();
      if (data.success) {
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.warn("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id: string, status: StoredAppointment["status"]) => {
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Appointment marked as ${status}`);
        fetchAppointments();
      }
    } catch (e: any) {
      toast.error("Error updating appointment", { description: e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-3 border-b border-[#E8DCCF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Clinical Eye Examinations & In-Store Consultations
          </h1>
          <p className="text-xs text-stone-500">
            Real-time appointments for Mayur Vihar atelier optometrist consultations, eye tests, and bespoke frame fittings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF3EB] text-[#C5A059] border border-[#E8DEC8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{appointments.length} Consultations Booked</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#E8DCCF] shadow-xs">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Pending Confirmation</p>
          <p className="text-2xl font-bold font-serif text-amber-600 mt-1">
            {appointments.filter((a) => a.status === "pending").length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-[#E8DCCF] shadow-xs">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Confirmed Slots</p>
          <p className="text-2xl font-bold font-serif text-[#0A251C] mt-1">
            {appointments.filter((a) => a.status === "confirmed").length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-[#E8DCCF] shadow-xs">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Completed Consultations</p>
          <p className="text-2xl font-bold font-serif text-emerald-700 mt-1">
            {appointments.filter((a) => a.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E8DCCF] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0A251C]">Consultation Bookings Queue</h3>
          <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Refresh Queue
          </Button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#C5A059]" />
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No consultations currently booked.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider border-b border-[#E8DCCF]">
                <tr>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCF]">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#0A251C]">
                      <div>{a.name}</div>
                      {a.notes && <div className="text-[11px] text-stone-400 italic mt-0.5">{a.notes}</div>}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{a.phone}</span>
                      </div>
                      {a.email && <div className="text-[11px] text-stone-400 mt-0.5">{a.email}</div>}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <div className="font-medium text-stone-800">{a.date}</div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {a.time}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-800">
                      {a.service}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(a.id, "confirmed")}
                            className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                        )}
                        {a.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(a.id, "completed")}
                            className="h-7 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Mark Complete
                          </Button>
                        )}
                        {a.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(a.id, "cancelled")}
                            className="h-7 text-[11px] border-stone-300 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
