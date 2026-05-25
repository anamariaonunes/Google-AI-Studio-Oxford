import React, { useState, useRef } from 'react';
import { 
  FileText, Calendar, Plus, ChevronDown, ChevronUp, Copy, Shield, CheckCircle2, 
  User, HelpCircle, ArrowLeft, Download, RefreshCw, AlertTriangle, Mail
} from 'lucide-react';
import { MeetingBatch, MeetingFile } from '../types';

interface DetailViewProps {
  meeting: MeetingBatch;
  onBack: () => void;
  onUploadStart: (files: FileList, batchId: string) => void;
  onAnalyze: (batchId: string) => void;
  isLoading: boolean;
  statusMessage?: string;
}

export default function DetailView({ 
  meeting, 
  onBack, 
  onUploadStart, 
  onAnalyze,
  isLoading,
  statusMessage 
}: DetailViewProps) {
  
  const [activeTab, setActiveTab] = useState<'summary' | 'decisions' | 'risks' | 'talkingPoints' | 'nextSteps'>('summary');
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null);
  const [objectivesState, setObjectivesState] = useState<Record<string, boolean>>({});
  const [copiedFollowUp, setCopiedFollowUp] = useState(false);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'High': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge-completed';
      case 'Processing': return 'badge-processing';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const toggleFileCollapse = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId);
  };

  const handleAddSupplementaryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadStart(e.target.files, meeting.id);
    }
  };

  const handleCopyFollowUp = () => {
    if (!meeting.intelligence?.follow_up_message) return;
    navigator.clipboard.writeText(meeting.intelligence.follow_up_message);
    setCopiedFollowUp(true);
    setTimeout(() => setCopiedFollowUp(false), 2000);
  };

  const toggleObjective = (text: string) => {
    setObjectivesState(prev => ({
      ...prev,
      [text]: !prev[text]
    }));
  };

  const handleDownloadPrepKit = () => {
    if (!meeting.intelligence) return;
    const intel = meeting.intelligence;
    
    let report = `====================================================\n`;
    report += `          PREP ASSISTANT EXECUTIVE BRIEFING KIT      \n`;
    report += `====================================================\n\n`;
    report += `TITLE: ${meeting.title}\n`;
    report += `GENERATION DATE: ${formatDate(meeting.lastUpdated)}\n`;
    report += `STATUS: ${meeting.status}\n\n`;
    
    report += `----------------- KEY TAKEAWAYS -----------------\n`;
    intel.key_takeaways.forEach((bullet, idx) => {
      report += `${idx + 1}. ${bullet}\n`;
    });
    report += `\n`;
    
    report += `----------------- DOCUMENT REVIEWS -----------------\n`;
    intel.meeting_summary.forEach((line, idx) => {
      report += ` - ${line}\n`;
    });
    report += `\n`;

    report += `----------------- DECISIONS REACHED -----------------\n`;
    intel.decisions.forEach((dec, idx) => {
      report += `[Decision ${idx + 1}] ${dec.decision}\n`;
      report += `    Owner: ${dec.owner} | Target: ${dec.deadline}\n\n`;
    });
    
    report += `----------------- RISK ASSESSMENT -----------------\n`;
    intel.risks_concerns.forEach((risk, idx) => {
      report += `[${idx + 1}] Risk: ${risk.risk}\n`;
      report += `    Severity: ${risk.severity}\n`;
      report += `    Estimated Impact: ${risk.impact}\n`;
      report += `    Mitigation Strategy: ${risk.mitigation}\n\n`;
    });
    
    report += `----------------- KEY TALKING POINTS -----------------\n`;
    report += `* INTERNAL ALIGNMENT LINES:\n`;
    intel.talking_points.internal.forEach((line) => {
      report += `   - ${line}\n`;
    });
    report += `\n* CLIENT/STAKEHOLDER FACING LINES:\n`;
    intel.talking_points.stakeholder_client.forEach((line) => {
      report += `   - ${line}\n`;
    });
    report += `\n* EXECUTIVE LEADERSHIP TAKEAWAYS:\n`;
    intel.talking_points.leadership.forEach((line) => {
      report += `   - ${line}\n`;
    });
    
    report += `\n----------------- NEXT STEPS & MILESTONES -----------------\n`;
    intel.next_steps.forEach((step, idx) => {
      report += `[Action ${idx + 1}] Activity: ${step.action_item}\n`;
      report += `    Owner: ${step.owner} | Target: ${step.deadline} | Priority: ${step.priority}\n\n`;
    });

    report += `\n----------------- OUTSTANDING QUESTIONS & FOLLOW-UP -----------------\n`;
    intel.open_questions.forEach((q, idx) => {
      report += ` - ${q}\n`;
    });
    report += `\nFollow-up Message Prompt:\n"${intel.follow_up_message}"\n`;

    report += `\nGenerated securely under executive license - jan.zaluska@gmail.com`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prep_Kit_${meeting.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto font-sans" id="detail-view-root">
      
      {/* Top Breadcrumb and sync utilities */}
      <div className="flex items-center justify-between border-b border-slate-250 pb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-md border border-slate-200"
          id="detail-back-button"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to list
        </button>

        <div className="flex items-center gap-2">
          {meeting.files.length > 0 && (
            <button
              onClick={() => onAnalyze(meeting.id)}
              disabled={isLoading}
              className={`flex items-center gap-1.5 text-xs bg-linear-to-r from-blue-100 to-sky-100 border border-blue-200 hover:from-blue-200 hover:to-sky-200 text-blue-950 font-bold py-1.5 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              id="analyze-intelligence-trigger"
            >
              <RefreshCw className={`w-3 h-3 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
              Generate Brief
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Header & Meta row details */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{meeting.title}</h2>
          <div className="flex items-center gap-2 text-xs text-slate-450 font-mono font-medium">
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-405" />
              Processed {meeting.files.length} files &bull; Created {formatDate(meeting.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(meeting.status)} border`}>
            {meeting.status}
          </span>
          {meeting.intelligence && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
              Intelligence Ready
            </span>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="bg-linear-to-r from-blue-50 to-sky-50 text-blue-900 p-3.5 rounded-xl flex items-center justify-between shadow-sm border border-blue-150 animate-pulse" id="processing-indicator-detail">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] font-bold tracking-wide text-blue-950">
              {statusMessage || "Syncing assets and running Gemini analysis pipeline..."}
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation row centered perfectly */}
      <div className="flex gap-6 border-b border-slate-200 shrink-0">
        {[
          { id: 'summary' as const, label: 'Summary' },
          { id: 'decisions' as const, label: 'Decisions & Questions' },
          { id: 'risks' as const, label: 'Risks' },
          { id: 'talkingPoints' as const, label: 'Talking Points' },
          { id: 'nextSteps' as const, label: 'Next Steps' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-1 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-550 text-blue-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Bottom Main Content Body Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Right column: High fidelity tabs workspace (col-span-8) */}
        <div className="lg:col-span-8">
          
          {!meeting.intelligence ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-4 shadow-none">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Briefing Analysis Required</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  We have extracted textual elements for your files. Click <b>"Generate Brief"</b> at the top right to build the executive kit via Gemini Intelligence.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Tab Content Display */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 min-h-[380px] shadow-none">
                
                {/* 1. Summary Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6" id="tab-pane-summary">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">Key Takeaways</h4>
                      <div className="space-y-3 text-slate-705 leading-normal">
                        {meeting.intelligence.key_takeaways.map((pt, idx) => (
                          <p key={idx} className="flex items-start gap-2.5 text-xs">
                            <span className="text-slate-400 font-bold">&#8212;</span>
                            <span className="font-semibold text-slate-850 leading-relaxed">{pt}</span>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2">Document Summary Overview</h4>
                      <ul className="space-y-2 list-none pl-0">
                        {meeting.intelligence.meeting_summary.map((pt, idx) => (
                          <li key={idx} className="flex gap-2 text-xs font-medium text-slate-600">
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Shared Follow-up Messaging Channel Email/Slack Template */}
                    {meeting.intelligence.follow_up_message && (
                      <div className="bg-slate-50 border border-slate-150 rounded-lg p-4 space-y-3 mt-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-800 uppercase tracking-wider">
                            <Mail className="w-3.5 h-3.5 text-indigo-600" />
                            Direct Sync Follow-up Brief Template
                          </span>
                          <button 
                            onClick={handleCopyFollowUp}
                            className="bg-white hover:bg-slate-100 text-[10px] font-bold border border-slate-200 px-2 py-1 rounded flex items-center gap-1 text-slate-700 cursor-pointer shadow-none"
                          >
                            <Copy className="w-3 h-3 text-slate-500" />
                            {copiedFollowUp ? "Copied" : "Copy Template"}
                          </button>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-700 font-serif italic bg-white border border-slate-100 p-3 rounded-md select-text">
                          "{meeting.intelligence.follow_up_message}"
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Decisions & Questions Tab */}
                {activeTab === 'decisions' && (
                  <div className="space-y-6" id="tab-pane-decisions">
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Decisions Reached</h4>
                        <p className="text-slate-400 text-[9px]">Verified outputs of aligned team members</p>
                      </div>
                      
                      <div className="space-y-3">
                        {meeting.intelligence.decisions.map((dec, idx) => {
                          const isDone = !!objectivesState[`dec-${idx}`];
                          return (
                            <div 
                              key={idx}
                              onClick={() => toggleObjective(`dec-${idx}`)}
                              className="border border-slate-150 rounded-lg p-4 bg-white hover:border-slate-300 transition-all cursor-pointer select-none flex items-start gap-3"
                            >
                              <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-all border ${isDone ? 'bg-slate-900 border-slate-900 text-white' : 'border-slate-350 bg-white'}`}>
                                {isDone && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <div className="space-y-1">
                                <span className={`text-xs block ${isDone ? 'line-through text-slate-400' : 'text-slate-800 font-bold'}`}>
                                  {dec.decision}
                                </span>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono text-slate-405 font-medium">
                                  <span>Owner: <b>{dec.owner}</b></span>
                                  <span>&bull;</span>
                                  <span>Deadline: <b>{dec.deadline}</b></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {meeting.intelligence.decisions.length === 0 && (
                          <p className="text-center py-6 text-slate-400 italic text-xs">No decision items have been noted.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Outstanding & Open Questions</h4>
                        <p className="text-slate-400 text-[9px]">Critical items requiring future coordination or agenda follow-ups</p>
                      </div>
                      <div className="space-y-2">
                        {meeting.intelligence.open_questions.map((q, idx) => (
                          <div key={idx} className="flex gap-2.5 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-xs font-semibold text-slate-800">{q}</p>
                          </div>
                        ))}

                        {meeting.intelligence.open_questions.length === 0 && (
                          <p className="text-center py-4 text-slate-400 italic text-xs">No pending open questions remain.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Risks Tab */}
                {activeTab === 'risks' && (
                  <div className="space-y-4" id="tab-pane-risks">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Risks & Concerns</h4>
                      <p className="text-slate-400 text-[9px]">Identified core risks and mitigation strategy pathways</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {meeting.intelligence.risks_concerns.map((item, idx) => (
                        <div key={idx} className="border border-slate-150 rounded-lg p-5 bg-white hover:border-slate-300 transition-all space-y-3">
                          <div className="flex justify-between items-start gap-3">
                            <h5 className="font-bold text-slate-900 text-sm">{item.risk}</h5>
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-mono uppercase font-bold whitespace-nowrap ${getSeverityStyle(item.severity)}`}>
                              {item.severity} Severity
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                            <div>
                              <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Impact Definition</p>
                              <p className="text-slate-600 leading-relaxed font-semibold">{item.impact}</p>
                            </div>
                            <div>
                              <p className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Mitigation Plan</p>
                              <p className="text-slate-800 font-bold leading-relaxed">{item.mitigation}</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {meeting.intelligence.risks_concerns.length === 0 && (
                        <p className="text-center py-8 text-slate-400 italic text-xs">No concerns have been flagged.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Talking Points Tab */}
                {activeTab === 'talkingPoints' && (
                  <div className="space-y-5" id="tab-pane-talking-points">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Executive Talking Lines</h4>
                      <p className="text-slate-400 text-[9px]">Strategic cues aligned by internal, client and leadership metrics</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Internal Guidance */}
                      <div className="space-y-2 bg-slate-50 p-4 border border-slate-150 rounded-lg">
                        <span className="text-[9px] font-mono uppercase font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                          Internal Team Alignment
                        </span>
                        <ul className="space-y-1.5 list-none pl-0 text-slate-650 pt-1.5">
                          {meeting.intelligence.talking_points.internal.map((line, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-slate-400">&#8212;</span>
                              <span className="text-xs font-semibold text-slate-700">{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Stakeholder Face */}
                      <div className="space-y-2 bg-[#F0FDF4] p-4 border border-[#DCFCE7] rounded-lg">
                        <span className="text-[9px] font-mono uppercase font-bold text-emerald-800 bg-white border border-[#DCFCE7] px-2 py-0.5 rounded">
                          Stakeholder or Client Facing Lines
                        </span>
                        <ul className="space-y-1.5 list-none pl-0 text-slate-650 pt-1.5">
                          {meeting.intelligence.talking_points.stakeholder_client.map((line, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-emerald-400">&#8212;</span>
                              <span className="text-xs font-semibold text-emerald-950">{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Leadership takeaways */}
                      <div className="space-y-2 bg-[#EFF6FF] p-4 border border-[#DBEAFE] rounded-lg">
                        <span className="text-[9px] font-mono uppercase font-bold text-blue-800 bg-white border border-[#DBEAFE] px-2 py-0.5 rounded">
                          Leadership Level Takeaways
                        </span>
                        <ul className="space-y-1.5 list-none pl-0 text-slate-655 pt-1.5">
                          {meeting.intelligence.talking_points.leadership.map((line, i) => (
                            <li key={i} className="flex gap-2 text-xs font-semibold">
                              <span className="text-blue-400">&#8212;</span>
                              <span className="text-blue-900">{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Next Steps Tab */}
                {activeTab === 'nextSteps' && (
                  <div className="space-y-4" id="tab-pane-next-steps">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Next Steps & Action items</h4>
                      <p className="text-slate-400 text-[9px]">Operational roadmap metrics</p>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden mt-2 bg-white scrollbar-none overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[9px] uppercase font-mono text-slate-400 border-b border-slate-200">
                            <th className="px-4 py-3 font-bold">Action Item</th>
                            <th className="px-4 py-3 font-bold">Owner</th>
                            <th className="px-4 py-3 font-bold">Deadline</th>
                            <th className="px-4 py-3 font-bold text-center">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                          {meeting.intelligence.next_steps.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-bold text-slate-800">{item.action_item}</td>
                              <td className="px-4 py-3 text-slate-600 font-semibold">{item.owner}</td>
                              <td className="px-4 py-3 text-slate-900 font-mono font-bold whitespace-nowrap">{item.deadline}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityStyle(item.priority)}`}>
                                  {item.priority}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

              {/* Action sync/download bar footer */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg flex items-center justify-between flex-wrap gap-4 text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  Stitch analysis synced
                </span>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadPrepKit}
                    className="bg-linear-to-r from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-200 text-blue-950 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 border border-blue-200 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    id="download-full-brief-kit-btn"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    Download Prep Kit
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Left column (col-span-4): Source Files sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-none space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Source Files</h4>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 rounded-sm font-bold">
                {meeting.files.length} Documents
              </span>
            </div>

            {/* Asset card list */}
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto scrollbar-none pr-1">
              {meeting.files.map((f) => (
                <div 
                  key={f.id} 
                  onClick={() => toggleFileCollapse(f.id)}
                  className={`p-3 rounded border text-left transition-all hover:bg-slate-50 cursor-pointer ${
                    expandedFileId === f.id ? 'border-semibold border-slate-600 bg-slate-50/50' : 'border-slate-150 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2.5 truncate max-w-[200px]">
                      <div className="w-8 h-8 rounded flex items-center justify-center font-bold text-[10px] shrink-0 bg-slate-100 text-slate-700 font-mono">
                        {f.type.toUpperCase()}
                      </div>
                      <div className="truncate text-xs">
                        <p className="font-bold text-slate-900 truncate">{f.name}</p>
                        <p className="text-[9px] font-mono text-slate-400">{Math.round(f.size / 100000) / 10} MB • {f.type.toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="pt-2">
                      {expandedFileId === f.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Extraction status badges */}
                  <div className="flex items-center gap-1.5 mt-2 text-[9px] font-mono font-bold">
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                      TEXT EXTRACTED
                    </span>
                  </div>

                  {/* Expanded block showing extracted text collapsible */}
                  {expandedFileId === f.id && (
                    <div className="mt-3 pt-3 border-t border-slate-150" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Extracted Content Preview</span>
                      </div>
                      <div className="bg-blue-50/40 text-blue-950 border border-blue-100 p-3 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36 overflow-y-auto leading-relaxed select-text cursor-text shadow-2xs">
                        {f.extractedText || "No text content found inside this material."}
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {meeting.files.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-5 bg-slate-50 rounded">No files attached yet.</p>
              )}
            </div>

            {/* Supplementary File upload input */}
            <div className="pt-1">
              <input
                type="file"
                ref={fileInputRef2}
                disabled={isLoading}
                onChange={handleAddSupplementaryFile}
                multiple
                accept=".pdf,.pptx"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef2.current?.click()}
                disabled={isLoading}
                className="w-full border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-white text-slate-600 rounded py-2 hover:text-slate-800 text-[11px] font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                id="add-supplementary-trigger"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Source File
              </button>
            </div>
          </div>

          {/* Graphical visual placard styled elegant */}
          <div className="rounded-xl overflow-hidden relative bg-linear-to-br from-blue-50/70 to-sky-100/70 border border-blue-150 text-blue-950 p-5 flex flex-col justify-end min-h-[140px] shadow-xs" id="placard-motto">
            <div className="relative z-10 space-y-1.5">
              <span className="text-[9px] font-mono uppercase tracking-widest font-bold text-blue-500/80">Executive Guideline</span>
              <p className="text-sm font-semibold tracking-tight text-blue-900 leading-snug">
                "Preparedness is the ultimate competitive advantage."
              </p>
              <div className="w-6 h-[1.5px] bg-blue-400 rounded" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
