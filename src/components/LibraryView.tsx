import { useState } from 'react';
import { 
  Search, Calendar, Eye, Filter, ArrowUpDown, ChevronLeft, ChevronRight, FileText, Trash2 
} from 'lucide-react';
import { MeetingBatch } from '../types';

interface LibraryViewProps {
  meetings: MeetingBatch[];
  onSelectMeeting: (meeting: MeetingBatch) => void;
  onDeleteMeeting: (id: string) => void;
  onNewBatchClick: () => void;
}

export default function LibraryView({ 
  meetings, 
  onSelectMeeting, 
  onDeleteMeeting,
  onNewBatchClick 
}: LibraryViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('Any');
  const [sortBy, setSortBy] = useState<'LastUpdated' | 'Title' | 'FilesCount'>('LastUpdated');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Formatting helpers
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRelativeTime = (isoStr: string) => {
    const elapsed = Date.now() - new Date(isoStr).getTime();
    const mins = Math.round(elapsed / 60000);
    const hrs = Math.round(mins / 60);
    const days = Math.round(hrs / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
    if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completed': return 'badge-completed';
      case 'Processing': return 'badge-processing';
      case 'Extraction Failed': return 'bg-rose-50 text-rose-700 border-rose-150';
      case 'Needs Review': return 'bg-amber-50 text-amber-700 border-amber-150';
      default: return 'bg-slate-50 text-slate-700 border-slate-150';
    }
  };

  // Filter application
  const filteredMeetings = meetings.filter((m) => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.intelligence?.key_takeaways || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.intelligence?.meeting_summary || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    
    const matchesFileType = fileTypeFilter === 'Any' || m.files.some(f => f.type === fileTypeFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesFileType;
  });

  // Sort application
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (sortBy === 'Title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'FilesCount') {
      return b.files.length - a.files.length;
    } else {
      // Default: Last Updated
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    }
  });

  // Pagination calculation
  const totalItems = sortedMeetings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedMeetings = sortedMeetings.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const startIdx = (page - 1) * itemsPerPage + 1;
  const endIdx = Math.min(page * itemsPerPage, totalItems);

  return (
    <div className="flex-1 p-8 space-y-6 max-w-7xl mx-auto w-full overflow-y-auto" id="library-view-root">
      
      {/* Search Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Meeting Library</h2>
          <p className="text-xs text-slate-500">Manage and filter your analyzed meeting materials</p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Real-time search */}
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search batches..."
              className="pl-8.5 pr-4 py-1.5 text-xs border border-slate-200 bg-white rounded-md focus:outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-300 w-full md:w-56 transition-all text-slate-800 font-medium"
              id="library-search-input"
            />
          </div>
          <button
            onClick={onNewBatchClick}
            className="bg-linear-to-r from-blue-100 to-sky-100 border border-blue-200 hover:from-blue-200 hover:to-sky-205 text-blue-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
            id="library-create-batch-btn"
          >
            + New Batch
          </button>
        </div>
      </div>

      {/* Control Filters Toolbar matching Design */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-lg" id="library-filters">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-150">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-xs font-bold text-slate-700 bg-transparent py-0.5 outline-hidden border-none shrink-0 cursor-pointer"
              id="filter-status-select"
            >
              <option value="All">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Draft">Draft</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Extraction Failed">Extraction Failed</option>
            </select>
          </div>

          {/* File Types Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-150">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Type:</span>
            <select
              value={fileTypeFilter}
              onChange={(e) => { setFileTypeFilter(e.target.value); setPage(1); }}
              className="text-xs font-bold text-slate-700 bg-transparent py-0.5 outline-hidden border-none shrink-0 cursor-pointer"
              id="filter-file-select"
            >
              <option value="Any">Any type</option>
              <option value="PDF">PDF Only</option>
              <option value="PPTX">PPTX Only</option>
            </select>
          </div>

        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-slate-150">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sort:</span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent py-0.5 outline-hidden border-none cursor-pointer"
            id="sort-select"
          >
            <option value="LastUpdated">Last Updated</option>
            <option value="Title">Title (Alpha)</option>
            <option value="FilesCount">Files count</option>
          </select>
        </div>
      </div>

      {/* Library Documents Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="library-table">
            <thead>
              <tr className="border-b border-slate-205 bg-slate-50/75 text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                <th className="px-6 py-3.5">Title</th>
                <th className="px-4 py-3.5">Upload Date</th>
                <th className="px-4 py-3.5 text-center">Files</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5">Insight Snippet</th>
                <th className="px-4 py-3.5 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {paginatedMeetings.map((m) => (
                <tr 
                  key={m.id}
                  onClick={() => onSelectMeeting(m)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-all active:bg-slate-100/50 group"
                  id={`library-row-${m.id}`}
                >
                  {/* Title Row with design icons */}
                  <td className="px-6 py-4 font-bold text-slate-950 max-w-[200px] truncate group-hover:text-indigo-650 transition-all">
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                      {m.title}
                    </span>
                  </td>
                  
                  {/* Creation Date */}
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </td>
                  
                  {/* File Quantity */}
                  <td className="px-4 py-4 text-slate-700 font-bold text-center whitespace-nowrap">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                      {m.files.length} file{m.files.length !== 1 ? 's' : ''}
                    </span>
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${getStatusStyle(m.status)}`}>
                      {m.status}
                    </span>
                  </td>
                  
                  {/* Last updated relative */}
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap font-mono text-[10px]">
                    {getRelativeTime(m.lastUpdated)}
                  </td>
                  
                  {/* Insight Snippet */}
                  <td className="px-6 py-4 text-slate-400 truncate max-w-[260px] italic">
                    {m.intelligence?.key_takeaways?.[0] || 
                     m.intelligence?.meeting_summary?.[0] || 
                     m.files[0]?.extractedText?.substring(0, 90) || 
                     "Draft batch. Upload PDF/PPTX to generate intelligence."}
                  </td>

                  {/* Delete row button */}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMeeting(m.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-all cursor-pointer"
                      title="Delete Briefing Batch"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              
              {paginatedMeetings.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold bg-slate-50/30">
                    No briefing batches matched your selection criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Elegant Pagination Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <p className="text-[10px] text-slate-500 font-bold tracking-tight">
            Showing <span className="text-slate-800">{startIdx}</span> to <span className="text-slate-800">{endIdx}</span> of <span className="text-slate-850">{totalItems}</span> matching briefings
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className={`p-1 rounded-md border ${page === 1 ? 'text-slate-300 border-slate-100 bg-transparent' : 'text-slate-600 border-slate-200 hover:bg-white cursor-pointer'}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-6 h-6 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  page === i + 1
                    ? 'bg-linear-to-br from-blue-100 to-sky-100 text-blue-950 border border-blue-250'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className={`p-1 rounded-md border ${page === totalPages ? 'text-slate-300 border-slate-100 bg-transparent' : 'text-slate-600 border-slate-200 hover:bg-white cursor-pointer'}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
