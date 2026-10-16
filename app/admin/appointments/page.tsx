"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  UserCheck,
  Phone,
  Plus,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/common/StatusBadge";
import { toast } from "sonner";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Appointment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [service, setService] = useState("Comprehensive Computerized Eye Test");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("11:30 AM");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleUpdateStatus = async (id: string, status: string) => {
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
      } else {
        toast.error("Failed to update status", { description: data.error });
      }
    } catch (e: any) {
      toast.error("Error updating appointment", { description: e.message });
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) {
      toast.error("Patient name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName.trim(),
          phone: patientPhone.trim(),
          email: patientEmail.trim() || undefined,
          service,
          date: appointmentDate || new Date().toISOString().split("T")[0],
          time: timeSlot,
          notes: notes.trim() || undefined,
          status: "confirmed",
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Consultation booked successfully in PostgreSQL");
        setIsModalOpen(false);
        setPatientName("");
        setPatientPhone("");
        setPatientEmail("");
        setNotes("");
        fetchAppointments();
      } else {
        toast.error("Booking error", { description: data.error });
      }
    } catch (err: any) {
      toast.error("Network error booking appointment", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="pb-3 border-b border-[#E8DCCF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0A251C] font-serif">
            Eye Examinations &amp; In-Store Consultations
          </h1>
          <p className="text-xs text-stone-500">
            Real-time appointment schedule for Mayur Vihar atelier optometrist consultations, eye tests, and bespoke frame fittings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Book New Consultation</span>
          </Button>
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
            Loading appointments queue...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500 space-y-3">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No consultations currently scheduled.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="text-xs border-[#E8DCCF]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Book Walk-in or Phone Reservation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-stone-500 uppercase tracking-wider border-b border-[#E8DCCF]">
                <tr>
                  <th className="py-3 px-4">Patron Patient</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
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
                      {a.booking_reference && (
                        <div className="text-[10px] text-stone-400 font-mono">{a.booking_reference}</div>
                      )}
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
                            className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Confirm
                          </Button>
                        )}
                        {a.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(a.id, "completed")}
                            className="h-7 text-[11px] border-blue-300 text-blue-700 hover:bg-blue-50 cursor-pointer"
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> Mark Complete
                          </Button>
                        )}
                        {a.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(a.id, "cancelled")}
                            className="h-7 text-[11px] border-stone-300 text-stone-600 hover:bg-red-50 hover:text-red-600 hover:border-red-300 cursor-pointer"
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

      {/* Book Consultation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#E8DCCF] shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-[#E8DCCF]">
              <h2 className="text-sm font-bold text-[#0A251C] font-serif">
                Schedule Eye Exam Consultation
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Vikram Seth"
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="098110 55432"
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    placeholder="patron@example.com"
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">Optometric Service</label>
                <select
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                >
                  <option value="Comprehensive Computerized Eye Test">Comprehensive Computerized Eye Test</option>
                  <option value="Bespoke Frame Fitting & Pupil Centering">Bespoke Frame Fitting &amp; Pupil Centering</option>
                  <option value="Progressive Lens Consultation">Progressive Lens Consultation</option>
                  <option value="Contact Lens Fitting & Trial">Contact Lens Fitting &amp; Trial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Date</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0A251C] mb-1">Time Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCCF] rounded-md text-xs text-[#0A251C]"
                  >
                    {["11:00 AM", "11:30 AM", "12:30 PM", "02:00 PM", "03:30 PM", "04:30 PM", "06:00 PM", "07:30 PM"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0A251C] mb-1">Clinical Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Progressive Rx update, dry eye sensitivity"
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
                  disabled={saving}
                  className="text-xs bg-[#C5A059] hover:bg-[#b59049] text-white"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
