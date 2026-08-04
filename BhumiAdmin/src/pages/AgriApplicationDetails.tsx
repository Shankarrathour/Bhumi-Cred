import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft,
  User,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

export const AgriApplicationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.get(`/admin/agri/applications/${id}`);
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch application details');
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError('Application not found');
      } else {
        setError('Network error loading details');
      }
      toast.error('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleAction = async (action: string) => {
    if (action === 'REQUEST_CLARIFICATION' && !remarks.trim()) {
      toast.error('Remarks are required for clarification.');
      return;
    }
    
    try {
      setActionLoading(true);
      const res = await adminApi.post(`/admin/agri/applications/${id}/action`, {
        action,
        remarks
      });
      
      if (res.data.success) {
        toast.success(res.data.message);
        setRemarks('');
        await fetchDetails(); // reload data
      } else {
        toast.error(res.data.message || 'Action failed');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network error processing action');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-[#00FF87] animate-pulse font-mono text-xs uppercase tracking-widest">Loading Details...</div>;
  }

  if (error || !data) {
    return (
      <div className="space-y-6 pb-12 font-mono uppercase tracking-wider text-xs">
        <button onClick={() => navigate('/admin/applications')} className="flex items-center gap-2 text-slate-400 hover:text-[#00FF87] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Applications
        </button>
        <div className="p-12 text-center text-rose-500 bg-black/40 border border-[#142217]">{error || 'Application not found'}</div>
      </div>
    );
  }

  const { application, farmer, scheme, answers, documents, timeline } = data;

  const getDocumentUrl = (url?: string) => {
    if (!url || url === '#') return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const backendOrigin = 'http://localhost:8000';
    return `${backendOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-5">
        <div>
          <button 
            onClick={() => navigate('/admin/applications')} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-primary" /> Back to Applications
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary" /> {application.application_reference || application._id}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Submitted on {new Date(application.submitted_at).toLocaleString()}
          </p>
        </div>
        
        <div className="flex flex-col sm:items-end gap-1.5">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-semibold border tracking-wide inline-block",
            application.status === 'APPROVED' 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" 
              : application.status === 'REJECTED' 
              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800" 
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
          )}>
            Status: {application.status}
          </span>
          <span className="text-muted-foreground text-xs font-medium">Current Step: {application.current_step}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Scheme Info */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <CheckCircle className="w-4.5 h-4.5 text-primary" /> Scheme Details
            </h2>
            {scheme ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-4 bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium">Scheme Name</div>
                  <div className="col-span-2 font-bold text-foreground">{scheme.title}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium">Department</div>
                  <div className="col-span-2 font-semibold text-foreground">{scheme.department}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium">Category ID</div>
                  <div className="col-span-2 text-foreground font-mono text-[11px]">{scheme.category_id}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs italic">No scheme data available.</div>
            )}
          </div>

          {/* Questionnaire Answers */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <FileText className="w-4.5 h-4.5 text-primary" /> Eligibility Assessment
            </h2>
            {answers && answers.length > 0 ? (
              <div className="space-y-3">
                {answers.map((ans: any, idx: number) => (
                  <div key={ans._id || idx} className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-2">
                    <div className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">Question {idx + 1}</div>
                    <div className="text-foreground font-semibold text-xs leading-relaxed">{ans.question_text}</div>
                    <div className="inline-block bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold mt-1">
                      Ans: {ans.answer_value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs italic">No questionnaire answers provided.</div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Download className="w-4.5 h-4.5 text-primary" /> Uploaded Documents
            </h2>
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {documents.map((doc: any, idx: number) => (
                  <div key={doc._id || idx} className="bg-muted/30 border border-border/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-foreground font-bold text-xs truncate capitalize" title={doc.document_type}>
                        {doc.document_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-1 break-all font-mono opacity-80">{doc.file_url}</div>
                    </div>
                    <a 
                      href={getDocumentUrl(doc.file_url)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs italic">No documents uploaded.</div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Farmer Info */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <User className="w-4.5 h-4.5 text-primary" /> Applicant Profile
            </h2>
            {farmer ? (
              <div className="space-y-3 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium text-[11px]">Name</div>
                  <div className="font-bold text-foreground mt-0.5">{farmer.full_name || 'N/A'}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium text-[11px]">Mobile</div>
                  <div className="font-semibold text-foreground mt-0.5">{farmer.phone_number || 'N/A'}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium text-[11px]">State</div>
                  <div className="font-semibold text-foreground mt-0.5">{farmer.state || 'N/A'}</div>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                  <div className="text-muted-foreground font-medium text-[11px]">District</div>
                  <div className="font-semibold text-foreground mt-0.5">{farmer.district || 'N/A'}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-xs italic">No farmer profile found.</div>
            )}
          </div>

          {/* Action Engine */}
          {(application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" /> Admin Action Engine
              </h2>
              <div className="space-y-3">
                <textarea 
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or reasoning..."
                  className="w-full bg-background border border-border rounded-xl text-foreground p-3 outline-none focus:border-primary/50 text-xs min-h-[90px] font-sans resize-none"
                />
                
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('APPROVE')}
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('REJECT')}
                    className="h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button 
                    disabled={actionLoading}
                    onClick={() => handleAction('REQUEST_CLARIFICATION')}
                    className="h-9 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> Clarify
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Clock className="w-4.5 h-4.5 text-primary" /> Activity Timeline
            </h2>
            {timeline && timeline.length > 0 ? (
              <div className="space-y-3 relative">
                {timeline.map((event: any, idx: number) => (
                  <div key={event._id || idx} className="bg-muted/30 border border-border/60 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-foreground text-xs">{event.title}</div>
                      <div className="text-muted-foreground text-[10px]">{new Date(event.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-muted-foreground text-xs leading-relaxed">{event.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground text-xs italic">No timeline events found.</div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};
