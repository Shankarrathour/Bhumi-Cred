import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

export const UserDashboardCMS: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [config, setConfig] = useState({
    solar_energy: 74,
    plantation_health: 92,
    nitrogen_retention_rate: 82,
    soil_organic_carbon: 0.65,
    boundary_tree_cover: 48
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/cms/user-dashboard');
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('Error fetching User Dashboard CMS:', error);
      toast.error('Failed to load User Dashboard CMS configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await adminApi.post('/cms/user-dashboard', config);

      if (response.status === 200) {
        toast.success('User Dashboard updated successfully!');
      } else {
        toast.error('Failed to update User Dashboard');
      }
    } catch (error) {
      console.error('Error updating User Dashboard CMS:', error);
      toast.error('Failed to update User Dashboard');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-48 bg-card border border-border rounded-xl shadow-sm gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-xs text-muted-foreground font-medium">Loading User Dashboard Configuration...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 font-sans"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 text-primary flex-1 leading-relaxed">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-foreground">User Dashboard Configuration</div>
            <div className="text-xs text-muted-foreground mt-0.5">Updates made here will reflect instantly on the Farmer App Home Screen.</div>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="h-10 px-4 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold shrink-0"
          title="Reload Data"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="space-y-6 bg-card border border-border rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-primary" /> Live Environmental Telemetry Telemetry
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Metric 1 */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-xl">
            <h4 className="text-xs font-bold text-foreground">Solar Energy (%)</h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Progress Percentage</label>
              <input 
                type="number" 
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-xs"
                value={config.solar_energy} 
                onChange={e => setConfig({ ...config, solar_energy: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-xl">
            <h4 className="text-xs font-bold text-foreground">Plantation Health (%)</h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Health Percentage</label>
              <input 
                type="number" 
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-xs"
                value={config.plantation_health} 
                onChange={e => setConfig({ ...config, plantation_health: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-xl">
            <h4 className="text-xs font-bold text-foreground">Nitrogen Retention Rate (%)</h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Retention Rate Percentage</label>
              <input 
                type="number" 
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-xs"
                value={config.nitrogen_retention_rate} 
                onChange={e => setConfig({ ...config, nitrogen_retention_rate: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>

          {/* Metric 4 */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-xl">
            <h4 className="text-xs font-bold text-foreground">Soil Organic Carbon (%)</h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Organic Carbon Score</label>
              <input 
                type="number" 
                step="0.01" 
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-xs"
                value={config.soil_organic_carbon} 
                onChange={e => setConfig({ ...config, soil_organic_carbon: parseFloat(e.target.value) || 0 })} 
              />
            </div>
          </div>

          {/* Metric 5 */}
          <div className="space-y-3 p-4 bg-muted/20 border border-border rounded-xl sm:col-span-2">
            <h4 className="text-xs font-bold text-foreground">Boundary Tree Cover (%)</h4>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Cover Percentage</label>
              <input 
                type="number" 
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans text-xs"
                value={config.boundary_tree_cover} 
                onChange={e => setConfig({ ...config, boundary_tree_cover: parseInt(e.target.value) || 0 })} 
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
