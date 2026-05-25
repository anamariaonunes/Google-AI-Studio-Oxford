import { useState, useEffect } from 'react';
import { 
  FolderPlus, Settings, FileText, CheckCircle2, Shield, Info, HelpCircle, LayoutDashboard, Database
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import LibraryView from './components/LibraryView';
import DetailView from './components/DetailView';
import NewBatchModal from './components/NewBatchModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import { MeetingBatch } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'library' | 'settings'>('dashboard');
  const [meetings, setMeetings] = useState<MeetingBatch[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingBatch | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Fetch batches initially on component mount
  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data);
        
        // Dynamic keepback selected state aligned and fresh!
        if (selectedMeeting) {
          const fresh = data.find((m: any) => m.id === selectedMeeting.id);
          if (fresh) setSelectedMeeting(fresh);
        }
      }
    } catch (err) {
      console.error("Failed to load meetings list from server:", err);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Handler: Create empty draft batch
  const handleCreateBatch = async (title: string) => {
    setIsLoading(true);
    setStatusMessage(`Creating briefing batch "${title}"...`);
    try {
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });
      if (res.ok) {
        const freshBatch = await res.json();
        await fetchMeetings();
        setSelectedMeeting(freshBatch);
        setActiveTab('dashboard'); // detail activates inside layout
      }
    } catch (err) {
      console.error("Failed creating batch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Delete complete batch folder
  const handleDeleteBatch = (id: string) => {
    const target = meetings.find(m => m.id === id);
    if (target) {
      setBatchToDelete({ id: target.id, title: target.title });
      setIsDeleteModalOpen(true);
    }
  };

  const executeDeleteBatch = async () => {
    if (!batchToDelete) return;
    try {
      const { id } = batchToDelete;
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMeetings();
        if (selectedMeeting?.id === id) {
          setSelectedMeeting(null);
        }
      }
    } catch (err) {
      console.error("Failed deleting batch:", err);
    } finally {
      setBatchToDelete(null);
    }
  };

  // Handler: Trigger unified Gemini API analytical assessment
  const handleAnalyzeBatch = async (batchId: string) => {
    setIsLoading(true);
    setStatusMessage("Extracting theme parameters and calling Gemini 3.5 capabilities...");
    try {
      const res = await fetch(`/api/meetings/${batchId}/analyze`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        await fetchMeetings();
        if (selectedMeeting?.id === batchId) {
          setSelectedMeeting(data.batch);
        }
      } else {
        const errData = await res.json();
        alert(`Analysis failed: ${errData.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error("Analysis triggered error:", err);
      alert(`Connection failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: Convert File object to Base64 asynchronously
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Str = (reader.result as string).split(',')[1];
        resolve(base64Str);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Master Upload Queue handler: PDF/PPTX converting and processing in sequence
  const handleUploadStart = async (files: FileList, targetBatchId?: string) => {
    setIsLoading(true);
    let activeId = targetBatchId || selectedMeeting?.id;

    // If there is no active batch, auto-create one with default nomenclature
    if (!activeId) {
      const guessedName = files[0] 
        ? files[0].name.replace(/\.[^/.]+$/, "").replace(/_/g, " ") + " Briefing"
        : "Auto Briefing Batch";
      
      setStatusMessage(`Initializing briefing container "${guessedName}"...`);
      try {
        const res = await fetch('/api/meetings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: guessedName })
        });
        if (res.ok) {
          const freshBatch = await res.json();
          activeId = freshBatch.id;
        } else {
          throw new Error("Could not initialize batch.");
        }
      } catch (err) {
        console.error("Auto batch init failed:", err);
        setIsLoading(false);
        return;
      }
    }

    // Process every uploaded file one-by-one to support safe client buffer chunks
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validExtensions = ['.pdf', '.pptx'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(ext)) {
        alert(`Rejected non-supported file: ${file.name}. Only PDF and PPTX slide decks are accepted.`);
        continue;
      }

      setStatusMessage(`Uploading & parsing text from "${file.name}"...`);
      try {
        const base64Data = await fileToBase64(file);
        const payload = {
          fileName: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          base64Data
        };

        const uploadRes = await fetch(`/api/meetings/${activeId}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!uploadRes.ok) {
          alert(`Failed uploading file slice for: ${file.name}`);
        }
      } catch (err) {
        console.error("File sequence load err:", err);
      }
    }

    // After uploading all file units successfully, update lists and automatically trigger Gemini analysis!
    setStatusMessage("Aggregating document matrices and querying Gemini AI brief builder...");
    await fetchMeetings();
    
    if (activeId) {
      await handleAnalyzeBatch(activeId);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden" id="app-viewport">
      
      {/* 1. Global Navigation Sidebar matching imagery */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedMeeting(null); // Reset detail page so tab click returns to category index
        }}
        onNewBatchClick={() => setIsModalOpen(true)}
      />

      {/* 2. Main content panels */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Header display */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 tracking-wider">
              WORKSPACE
            </span>
            <span className="text-slate-350 text-xs">/</span>
            <span className="text-xs font-bold text-slate-800 tracking-tight">
              {selectedMeeting ? selectedMeeting.title : (activeTab === 'dashboard' ? 'Overview' : activeTab.toUpperCase())}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
              Pro Tier Authorized
            </span>
          </div>
        </header>

        {/* Routers */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedMeeting ? (
            <DetailView 
              meeting={selectedMeeting}
              onBack={() => setSelectedMeeting(null)}
              onUploadStart={handleUploadStart}
              onAnalyze={handleAnalyzeBatch}
              isLoading={isLoading}
              statusMessage={statusMessage}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  meetings={meetings}
                  onSelectMeeting={setSelectedMeeting}
                  onDeleteMeeting={handleDeleteBatch}
                  onUploadStart={handleUploadStart}
                  isLoading={isLoading}
                  statusMessage={statusMessage}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'library' && (
                <LibraryView 
                  meetings={meetings}
                  onSelectMeeting={setSelectedMeeting}
                  onDeleteMeeting={handleDeleteBatch}
                  onNewBatchClick={() => setIsModalOpen(true)}
                />
              )}

              {activeTab === 'settings' && (
                <div className="flex-1 p-8 space-y-6 max-w-4xl mx-auto w-full overflow-y-auto" id="settings-tab-pane">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Suite Configurations</h2>
                    <p className="text-xs text-slate-500">Manage security clearances and aesthetic protocols</p>
                  </div>

                  {/* API Secret clearance cards */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Gemini API Security Verification
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This application operates securely using full-stack API proxies. Your private credential tokens are handled server-side to prevent exposing keys to the browser, conforming with production SaaS security guidelines.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      clearance active: GEMINI_API_KEY injected automatically from settings workspace
                    </div>
                  </div>

                  {/* Aesthetic identity cards */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      <Database className="w-5 h-5 text-indigo-600" />
                      Aesthetic Core Specs (Stitch Guide)
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      PrepAssistant is locked to the cool-neutral identity. Spacings and color scales have been paired to optimize executive focus under rapid decision conditions:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[
                        { label: 'Cool Slate White', value: '#f8fafc' },
                        { label: 'Soft Ash Grey', value: '#f1f5f9' },
                        { label: 'Pale Stone', value: '#e2e8f0' },
                        { label: 'Deep Navy', value: '#0f172a' },
                      ].map((sw, index) => (
                        <div key={index} className="border border-slate-100 rounded-lg p-2 flex items-center gap-2">
                          <div className="w-5 h-5 rounded" style={{ backgroundColor: sw.value }} />
                          <div className="font-mono text-[10px]">
                            <p className="font-bold text-slate-800">{sw.label}</p>
                            <p className="text-slate-400">{sw.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* General suite stats information */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Application Version 1.0.0 (Executive Build)</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        To add new files to existing batches, drag and drop documents on the landing dashboard or tap "Add Supplementary File" inside the briefing reader details workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>

      {/* 3. Batch Creation popup dialog elements */}
      <NewBatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateBatch}
      />

      {/* 4. Batch Deletion confirmation modal elements */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setBatchToDelete(null);
        }}
        onConfirm={executeDeleteBatch}
        title={batchToDelete?.title || ""}
      />

    </div>
  );
}
