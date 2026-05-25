import React, { useState, useRef } from 'react';
import { 
  UploadCloud, FileText, ChevronRight, AlertTriangle, MessageSquare, 
  Layers, Clock, FileAudio, ExternalLink, MoreVertical, Trash2 
} from 'lucide-react';
import { MeetingBatch } from '../types';

interface DashboardViewProps {
  meetings: MeetingBatch[];
  onSelectMeeting: (meeting: MeetingBatch) => void;
  onDeleteMeeting: (id: string) => void;
  onUploadStart: (files: FileList, batchTitle?: string) => void;
  isLoading: boolean;
  statusMessage?: string;
  setActiveTab: (tab: 'dashboard' | 'library' | 'settings') => void;
}

export default function DashboardView({ 
  meetings, 
  onSelectMeeting, 
  onDeleteMeeting,
  onUploadStart, 
  isLoading,
  statusMessage,
  setActiveTab 
}: DashboardViewProps) {
  
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    meetings.length > 0 ? meetings[0].id : null
  );
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  // File dropzone event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadStart(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadStart(e.target.files);
    }
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge-completed';
      case 'Processing': return 'badge-processing';
      case 'Extraction Failed': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Needs Review': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row gap-6 p-8 overflow-y-auto max-w-7xl w-full mx-auto" id="dashboard-view-root">
      
      {/* Left Column: Greeting, Dropzone and Recent list */}
      <div className="flex-1 space-y-6">
        {/* Pitch / Greeting */}
        <div className="space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Ready for your next briefing?
          </h2>
          <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
            Upload your meeting materials to generate structured briefs, identify risks, and draft talking points for your upcoming sessions.
          </p>
        </div>

        {/* Upload Dropzone */}
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragOver 
              ? 'border-indigo-500 bg-indigo-50/40' 
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/10'
          }`}
          id="dashboard-dropzone"
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            multiple 
            accept=".pdf,.pptx" 
            className="hidden" 
          />
          
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-3 text-indigo-600">
            <UploadCloud className="w-5 h-5 text-indigo-650" />
          </div>

          <h3 className="text-xs font-bold text-slate-800">Drop meeting files here</h3>
          <p className="text-[10px] text-slate-400 mt-1 mb-3">PDF files, presentation slide decks, and supporting documents</p>
          
          <button 
            type="button"
            className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold hover:bg-slate-50 transition-all text-slate-700 cursor-pointer"
            id="browse-files-btn"
          >
            Browse Files
          </button>
        </div>

        {/* Global Action Processing Overlay inside dashboard */}
        {isLoading && (
          <div className="bg-linear-to-r from-blue-50 to-sky-50 text-blue-900 p-3.5 rounded-xl flex items-center justify-between shadow-sm border border-blue-150 animate-pulse animate-duration-1000" id="processing-indicator">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[11px] font-bold tracking-wide">
                {statusMessage || "Analyzing uploaded assets..."}
              </p>
            </div>
          </div>
        )}

        {/* Recent Meetings Headers */}
        <div className="space-y-3">
          <div className="flex justify-between items-center bg-transparent">
            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Batches</h3>
            <button 
              onClick={() => setActiveTab('library')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded transition-all cursor-pointer"
              id="btn-view-all-library"
            >
              View All Library
            </button>
          </div>

          {meetings.length === 0 ? (
            <div className="bg-white rounded-lg p-8 border border-slate-200 text-center shadow-xs">
              <FileText className="w-6 h-6 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No meeting materials analyzed yet.</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Upload a PDF or PPTX to view AI briefs immediately.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="recent-grid">
              {meetings.slice(0, 4).map((meeting) => (
                <div 
                  key={meeting.id}
                  onClick={() => setSelectedMeetingId(meeting.id)}
                  className={`border rounded-xl p-5 cursor-pointer transition-all flex flex-col justify-between h-40 ${
                    selectedMeetingId === meeting.id
                      ? 'border-blue-300 bg-linear-to-br from-blue-50/50 to-sky-50/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-250'
                  }`}
                  id={`recent-card-${meeting.id}`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-mono tracking-wider font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(meeting.status)}`}>
                        {meeting.status}
                      </span>
                      
                      {/* Trash/Options */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === meeting.id ? null : meeting.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                          id={`menu-trigger-${meeting.id}`}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === meeting.id && (
                          <div className="absolute right-0 top-6 bg-white border border-slate-250 rounded-md shadow-sm py-1 w-28 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMeeting(meeting.id);
                                if (selectedMeetingId === meeting.id) {
                                  setSelectedMeetingId(null);
                                }
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {meeting.title}
                    </h4>
                    
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {meeting.intelligence?.key_takeaways?.[0] || 
                       meeting.intelligence?.meeting_summary?.[0] || 
                       meeting.files[0]?.extractedText?.substring(0, 90) || 
                       "Awaiting text extraction and analytics..."}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDate(meeting.createdAt)}
                    </span>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">
                      {meeting.files.length} file{meeting.files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Insight Preview Panel representing card-minimal exactly */}
      <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between" id="insight-preview-pane">
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-widest">Insight Preview</h3>
          </div>

          {!selectedMeeting ? (
            <div className="py-20 text-center space-y-2">
              <FileText className="w-6 h-6 text-slate-300 mx-auto animate-pulse" />
              <p className="text-xs font-medium text-slate-400">Select a meeting to view details</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Heading Summary */}
              <div>
                <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(selectedMeeting.status)}`}>
                  {selectedMeeting.status}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                  {selectedMeeting.title}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Analyzed {formatDate(selectedMeeting.lastUpdated)}
                </p>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Uploaded Materials</p>
                <div className="space-y-1 w-full">
                  {selectedMeeting.files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-slate-50 rounded border border-slate-100">
                      <span className="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[170px]">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {f.name}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {Math.round(f.size / 100000)} MB
                      </span>
                    </div>
                  ))}
                  {selectedMeeting.files.length === 0 && (
                    <p className="text-[11px] text-slate-450 italic">No files attached inside this batch.</p>
                  )}
                </div>
              </div>

              {/* Priority Threat Card Preview */}
              {selectedMeeting.intelligence?.risks_concerns?.[0] && (
                <div className="border border-rose-100 bg-rose-50/50 rounded-md p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] text-rose-800 font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Identified Risk ({selectedMeeting.intelligence.risks_concerns[0].severity})
                  </div>
                  <h5 className="text-xs font-bold text-rose-950">
                    {selectedMeeting.intelligence.risks_concerns[0].risk}
                  </h5>
                  <p className="text-[11px] text-rose-800 line-clamp-2 leading-relaxed font-medium">
                    {selectedMeeting.intelligence.risks_concerns[0].impact}
                  </p>
                </div>
              )}

              {/* Snippet summary points */}
              {selectedMeeting.intelligence?.key_takeaways ? (
                <div className="space-y-2">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Core Bullet Insights</p>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed list-none pl-0">
                    {selectedMeeting.intelligence.key_takeaways.slice(0, 2).map((pt, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-slate-400 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-slate-200 rounded-md bg-slate-50/50">
                  <Clock className="w-4 h-4 mx-auto text-slate-400 animate-spin" />
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">Text parsed successfully.</p>
                  <p className="text-[9px] text-slate-400">Undergoing executive intelligence analysis...</p>
                </div>
              )}

              {/* Cover Palette Guideline Preview */}
              {selectedMeeting.intelligence && (
                <div className="space-y-1 bg-slate-50 rounded-md p-2.5 border border-slate-100">
                  <p className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">Stitch Palette</p>
                  <div className="flex gap-1.5 pt-0.5">
                    {['cool slate white', 'pale stone', 'deep navy', 'muted indigo', 'steel blue'].map((color, idx) => (
                      <div 
                        key={idx}
                        title={color}
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{
                          backgroundColor: 
                            color.includes("navy") ? "#0f172a" :
                            color.includes("white") ? "#f8fafc" :
                            color.includes("indigo") ? "#4f46e5" :
                            color.includes("steel") ? "#64748b" : "#e2e8f0"
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {selectedMeeting && (
          <button
            onClick={() => onSelectMeeting(selectedMeeting)}
            className="w-full bg-linear-to-r from-blue-100 to-sky-100 hover:from-blue-200 hover:to-sky-205 text-blue-950 border border-blue-200 rounded-xl py-2.5 px-3 mt-6 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            id="open-full-brief-btn"
          >
            <span>Open Full Brief</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </button>
        )}
      </div>

    </div>
  );
}
