"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { StatusPill } from "@/components/shared/StatusPill";
import { useLead, useUpdateLead, useRegenerateEmail } from "@/hooks/useLeads";
import type { OutreachStatus } from "@/types";

interface Props {
  leadId: string | null;
  onClose: () => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
      title={`Copy ${label}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : `Copy ${label}`}
    </button>
  );
}

export function LeadDetailDrawer({ leadId, onClose }: Props) {
  const { data: lead, isLoading } = useLead(leadId ?? "");
  const updateLead = useUpdateLead();
  const regenerateEmail = useRegenerateEmail();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (lead) setNotes(lead.notes ?? "");
  }, [lead]);

  if (!leadId) return null;

  const handleStatusChange = async (status: OutreachStatus) => {
    if (!lead) return;
    try {
      await updateLead.mutateAsync({ id: lead.id, body: { outreach_status: status } });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleNotesSave = async () => {
    if (!lead) return;
    try {
      await updateLead.mutateAsync({ id: lead.id, body: { notes } });
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleRegenerate = async () => {
    if (!lead) return;
    try {
      await regenerateEmail.mutateAsync(lead.id);
      toast.success("Email regenerated");
    } catch {
      toast.error("Failed to regenerate email");
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            {isLoading ? (
              <div className="h-5 w-40 bg-gray-100 rounded animate-pulse" />
            ) : (
              <>
                <h2 className="font-semibold text-gray-900">{lead?.company_name}</h2>
                <p className="text-xs text-gray-400">{lead?.niche}</p>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !lead ? (
            <p className="text-gray-400">Lead not found.</p>
          ) : (
            <>
              {/* Score + Status */}
              <div className="flex items-center gap-3">
                <ScoreBadge score={lead.score} tier={lead.score_tier} />
                <select
                  value={lead.outreach_status}
                  onChange={(e) => handleStatusChange(e.target.value as OutreachStatus)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                  <option value="replied">Replied</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Contact */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Name</p>
                    <p className="font-medium">{lead.contact_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Title</p>
                    <p className="font-medium">{lead.contact_title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="font-medium truncate">{lead.contact_email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="font-medium">{lead.contact_phone || "—"}</p>
                  </div>
                  {lead.contact_linkedin && (
                    <div className="col-span-2">
                      <p className="text-gray-400 text-xs">LinkedIn</p>
                      <a
                        href={lead.contact_linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        View profile <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Pain Signals */}
              {lead.pain_signals?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Pain Signals</h3>
                  <div className="space-y-2">
                    {lead.pain_signals.map((s, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 text-sm text-gray-700">{s.signal}</div>
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.round(s.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{Math.round(s.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hiring Triggers */}
              {lead.hiring_triggers?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Hiring Triggers</h3>
                  <div className="flex flex-wrap gap-2">
                    {lead.hiring_triggers.map((t, i) => (
                      <span key={i} className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full">
                        {t.role} · {t.platform}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Email */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">AI Email Draft</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerateEmail.isPending}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${regenerateEmail.isPending ? "animate-spin" : ""}`} />
                      Regenerate
                    </button>
                  </div>
                </div>
                {lead.email_subject ? (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">Subject</p>
                      <CopyButton text={lead.email_subject} label="subject" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{lead.email_subject}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-400">Body</p>
                      <CopyButton text={lead.email_body ?? ""} label="body" />
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{lead.email_body}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Email generating…</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesSave}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Add notes…"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
