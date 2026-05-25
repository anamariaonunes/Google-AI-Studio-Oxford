import { LayoutDashboard, Library, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'library' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'library' | 'settings') => void;
  onNewBatchClick: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onNewBatchClick }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library' as const, label: 'Library', icon: Library },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-[220px] bg-white flex flex-col min-h-screen border-r border-slate-200 shrink-0" id="app-sidebar">
      {/* Brand Identity Header */}
      <div className="p-6 flex items-center gap-2.5 mb-2" id="sidebar-logo-container">
        <div className="w-8 h-8 bg-linear-to-br from-blue-500 to-sky-600 rounded-lg flex items-center justify-center shrink-0 shadow-xs">
          <div className="w-4 h-4 border border-white rounded-xs"></div>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
            PrepAssistant
          </h1>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
            Stitch Intel
          </p>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="px-4 pb-4">
        <button
          onClick={onNewBatchClick}
          className="w-full bg-linear-to-r from-blue-50 to-sky-100 hover:from-blue-100 hover:to-sky-150 hover:bg-blue-100 text-blue-950 border border-blue-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          id="btn-sidebar-new-batch"
        >
          <span className="text-sm font-bold text-blue-600">+</span>
          New Batch
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Navigation</div>
        
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                 isActive
                   ? 'bg-blue-50/70 border-blue-100/60 text-blue-900 shadow-3xs'
                   : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900 border-transparent'
               }`}
               id={`nav-item-${item.id}`}
            >
               <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-650 font-bold' : 'text-slate-400'}`} />
               {item.label}
            </button>
          );
        })}
      </nav>

      {/* Pro Credits Block equivalent / Dynamic tier presentation */}
      <div className="p-4" id="credits-block">
        <div className="bg-linear-to-br from-blue-50/70 to-sky-50/40 p-3.5 rounded-xl border border-blue-100/70 shadow-3xs">
          <p className="text-[11px] font-bold text-blue-950 mb-0.5">Suite Active</p>
          <p className="text-[9px] text-blue-650 font-semibold">Stitch analytical extraction enabled.</p>
        </div>
      </div>

      {/* User Information Footer */}
      <div className="p-4 border-t border-slate-150 bg-slate-50/50" id="user-profile-badge">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-750 font-bold text-xs shrink-0">
            AN
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate leading-tight">Ana Nunes</p>
            <p className="text-[9px] text-blue-600 font-medium truncate leading-none">Executive Member</p>
          </div>
        </div>
      </div>
    </div>
  );
}
