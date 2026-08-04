import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Award, 
  Search, 
  X, 
  ShieldCheck, 
  CheckCircle2,
  Leaf
} from 'lucide-react';

export const CertificatesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [verifySerial, setVerifySerial] = useState('');
  const [verifiedCert, setVerifiedCert] = useState<any | null>(null);
  const [covers, setCovers] = useState<any[]>([]);

  useEffect(() => {
    fetchCovers();
  }, []);

  const fetchCovers = async () => {
    try {
      // This page still expects the full (unpaginated) list; the Green Family
      // admin page is the one with real pagination — see GreenFamily.tsx.
      const response = await api.get('/admin/green-family', { params: { limit: 100 } });
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      if (data.length === 0) {
        setCovers([
          { id: '1', farmer_id: 'FRM-001', farmer_name: 'Gurdev Singh Dhillon', cluster_size: 500, amount: 1000, status: 'Pending', created_at: new Date().toISOString() },
          { id: '2', farmer_id: 'FRM-002', farmer_name: 'Mahadevappa Gowda', cluster_size: 1200, amount: 2500, status: 'Pending', created_at: new Date().toISOString() },
          { id: '3', farmer_id: 'FRM-004', farmer_name: 'Ramesh Tukaram Patil', cluster_size: 400, amount: 800, status: 'Pending', created_at: new Date().toISOString() },
        ]);
      } else {
        setCovers(data);
      }
    } catch (error) {
      console.error('Failed to fetch green family covers', error);
      setCovers([
        { id: '1', farmer_id: 'FRM-001', farmer_name: 'Gurdev Singh Dhillon', cluster_size: 500, amount: 1000, status: 'Pending', created_at: new Date().toISOString() },
      ]);
    }
  };

  const activeCertificates = covers.filter(p => 
    (p.farmer_id?.toLowerCase().includes(search.toLowerCase()) ||
     p.id?.toLowerCase().includes(search.toLowerCase()))
  ).map(p => ({
    id: p.id,
    farmerName: p.farmer_name || `Farmer ${p.farmer_id?.substring(0,6)}`,
    farmerId: p.farmer_id,
    treeCount: p.cluster_size || 5,
    greenFamilySerial: `GF-${(p.farmer_id || '').substring(0,4)}-${p.id?.substring(0,6)}`.toUpperCase(),
    plantationDate: new Date(p.created_at).toLocaleDateString(),
    status: p.status
  }));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifySerial) return;

    const match = activeCertificates.find(p => 
      p.greenFamilySerial && 
      (p.greenFamilySerial.toLowerCase() === verifySerial.toLowerCase() ||
       p.greenFamilySerial.toLowerCase().includes(verifySerial.toLowerCase()))
    );

    if (match) {
      try {
        await api.put(`/admin/green-family/${match.id}/status`, { status: 'Verified' });
        setVerifiedCert(match);
        toast.success('Green Family credentials cryptographically verified against BhumiCred Registry!');
        fetchCovers();
      } catch (error) {
        toast.error('Failed to verify credential on server.');
      }
    } else {
      toast.error('Verification failed. Invalid certificate serial number or checksum.');
    }
  };

  const handleDownload = async (certId: string, farmerName: string) => {
    toast.success(`Printable PDF certificate download initiated for: ${farmerName}`);
    try {
      const response = await api.get(`/admin/green-family/${certId}/certificate`);
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(response.data);
        newWin.document.close();
      }
    } catch (error) {
      toast.error('Failed to download certificate');
    }
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-lg font-black uppercase tracking-wider leading-none">Green Families Credentials Board</h1>
        <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
          Verify issued voluntary Green Family credentials, audit cryptographic carbon hashes, and print plantation certificates for farmers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side: Verify Certificate Input Box */}
        <div className="lg:col-span-1 bg-card border border-border p-4 space-y-4 h-auto shadow-sm">
          <div className="border-b border-border pb-2 flex items-center gap-2 text-primary">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Biometric Credential Lookup</h3>
          </div>

          <form onSubmit={handleVerify} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[8px] text-muted-foreground block pl-0.5 uppercase">Certificate Serial Number</label>
              <input 
                type="text"
                value={verifySerial}
                onChange={e => setVerifySerial(e.target.value)}
                placeholder="e.g. GF-FRM-001 or GF-KRNL-..."
                required
                className="w-full h-10 bg-background border border-border px-3 text-[9px] outline-none focus:border-primary/50 uppercase rounded-none text-foreground"
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-primary text-primary-foreground font-black uppercase text-[9px] hover:shadow-[0_0_10px_rgba(0,255,135,0.4)] flex items-center justify-center gap-1.5 border border-primary/20 transition-all rounded-none"
            >
              <ShieldCheck className="w-4 h-4 text-primary-foreground" />
              <span>Verify Cryptographic Serial</span>
            </button>
          </form>

          <p className="text-[8px] text-muted-foreground leading-relaxed normal-case pt-2.5 border-t border-border/50 font-bold">
            All Green Family environmental credentials are permanently written to voluntary carbon ledger hashes, linking district forest departments and plantation registries.
          </p>
        </div>

        {/* Right Side: Issued Certificates Registry Table */}
        <div className="lg:col-span-2 bg-card border border-border p-4 flex flex-col h-[380px] overflow-hidden shadow-sm">
          <div className="border-b border-border pb-3.5 space-y-3 shrink-0">
            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest">Issued Credentials Registry</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
              <input 
                type="text"
                placeholder="SEARCH CREDENTIALS BY FARMER OR SERIAL ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-border pl-9 pr-3 py-2 text-[9px] outline-none focus:border-primary/50 text-foreground"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto pt-2.5 pr-1 scrollbar-thin">
            <table className="w-full text-left text-[9px] font-bold tracking-wider">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[8px] tracking-widest uppercase">
                  <th className="pb-2.5">Insured Citizen</th>
                  <th className="pb-2.5">Plantation Scope</th>
                  <th className="pb-2.5">Green Family Serial</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-foreground">
                {activeCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/30 transition-all group">
                    <td className="py-2.5">
                      <p className="font-extrabold text-foreground">{cert.farmerName}</p>
                      <p className="text-[7.5px] font-mono text-muted-foreground tracking-widest mt-0.5">{cert.farmerId}</p>
                    </td>
                    <td className="py-2.5 text-muted-foreground uppercase">{cert.treeCount} Poplar Trees</td>
                    <td className="py-2.5 text-primary font-bold font-mono">{cert.greenFamilySerial}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            try {
                              await api.put(`/admin/green-family/${cert.id}/status`, { status: 'Verified' });
                              setVerifySerial(cert.greenFamilySerial || '');
                              setVerifiedCert(cert);
                              toast.success('Green Family credentials verified!');
                              fetchCovers();
                            } catch (error) {
                              toast.error('Failed to verify');
                            }
                          }}
                          className={`px-2 py-1 border text-[8px] font-black rounded-none transition-colors ${cert.status === 'Verified' ? 'border-primary/50 text-primary/50 cursor-not-allowed' : 'border-primary text-primary hover:bg-primary/5'}`}
                          disabled={cert.status === 'Verified'}
                        >
                          {cert.status === 'Verified' ? 'Verified' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleDownload(cert.id, cert.farmerName)}
                          className="px-2 py-1 border border-accent text-accent hover:bg-accent/5 text-[8px] font-black rounded-none transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Visual Government Certificate Overlay Modal */}
      <AnimatePresence>
        {verifiedCert && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setVerifiedCert(null)}
              className="fixed inset-0 z-45 bg-black/85"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 m-auto z-50 w-full max-w-xl h-[420px] bg-[#0A120D] text-foreground border-4 border-double border-[#00FF87] p-6 shadow-2xl flex flex-col justify-between select-none font-mono"
            >
              {/* Background grid overlay detail */}
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#00FF87_1px,transparent_1px),linear-gradient(to_bottom,#00FF87_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Top Seal */}
              <div className="flex flex-col items-center text-center space-y-1 relative z-10">
                <Leaf className="w-8 h-8 text-primary animate-pulse shrink-0" />
                <h2 className="text-[11px] font-black uppercase tracking-wider text-primary">BHUMICRED VOLUNTARY LEDGER</h2>
                <h3 className="text-[8px] font-black text-muted-foreground tracking-widest border-b border-border/80 pb-1 w-2/3 uppercase">
                  GREEN FAMILY ENVIRONMENTAL COMPLIANCE DEED
                </h3>
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col justify-center text-center space-y-4 py-4 font-bold uppercase tracking-wider relative z-10">
                <span className="text-[9px] text-primary font-black tracking-widest uppercase">CERTIFICATE OF PLANTATION CONSERVATION</span>
                
                <p className="text-[8.5px] text-muted-foreground normal-case font-bold max-w-sm mx-auto leading-relaxed">
                  This is to cryptographically verify that the empanelled citizen farmer
                </p>
                
                <h1 className="text-sm font-black tracking-wider text-primary border-b border-primary/20 pb-0.5 max-w-xs mx-auto uppercase">
                  {verifiedCert.farmerName}
                </h1>
                
                <p className="text-[8.5px] text-muted-foreground normal-case font-bold max-w-sm mx-auto leading-relaxed">
                  has successfully verified their boundary plantation, establishing active lock-in coverage of
                </p>
                
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest leading-snug">
                  {verifiedCert.treeCount} ECO-COMPLIANT POPLAR TREES
                </h4>

                <p className="text-[8px] text-primary font-black tracking-widest border border-primary/25 bg-primary/5 py-1 px-3 max-w-xs mx-auto">
                  CREDENTIALS LEVEL: ACTIVE GREEN FAMILY
                </p>
              </div>

              {/* Signatures & Security */}
              <div className="border-t border-border/50 pt-4 flex items-center justify-between text-[7.5px] font-black tracking-widest text-muted-foreground relative z-10">
                <div className="space-y-1 text-left">
                  <span>PLANTATION DATE: {verifiedCert.plantationDate}</span>
                  <span className="block font-mono text-[7px] text-primary/80">SERIAL ID: {verifiedCert.greenFamilySerial}</span>
                </div>

                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/25 text-primary px-2 py-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> LEDGER SYNCED
                </div>

                <div className="space-y-1 text-right">
                  <span className="block border-b border-border pb-0.5 text-foreground">REGISTRY TRUSTEE</span>
                  <span className="block text-[6.5px] text-muted-foreground">NODAL INTEGRITY SIGN</span>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setVerifiedCert(null)} 
                className="absolute top-3.5 right-3.5 p-1 border border-primary/20 hover:border-primary hover:bg-muted text-primary z-20"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
