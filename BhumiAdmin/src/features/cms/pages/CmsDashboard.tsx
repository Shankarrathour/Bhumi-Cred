import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Eye, Edit, Plus, AlertCircle, Loader2, ImageOff } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '@mui/material';
import { useBanners, useCmsDashboard } from '../api/useCms';

export const CmsDashboard = () => {
  const { data: banners, isLoading, isError, refetch } = useBanners();
  const { data: cmsDashboard } = useCmsDashboard();

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="CMS & Content Management"
        description="Manage banners, homepage config, and platform content."
        icon={FileText}
        actions={<Button variant="contained" color="primary" startIcon={<Plus size={16} />}>Create Content</Button>}
      />

      {/* CMS Dashboard Section */}
      {cmsDashboard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="ent-card p-4"
        >
          <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <FileText size={16} className="text-indigo-500" /> Homepage CMS Config
          </h3>
          <p className="text-sm text-slate-500">
            Live homepage configuration fetched from <code className="bg-slate-100 px-1 rounded">/cms/user-dashboard</code>.
            {Object.keys(cmsDashboard).length > 0
              ? ` Keys: ${Object.keys(cmsDashboard).join(', ')}.`
              : ' No keys returned.'}
          </p>
        </motion.div>
      )}

      {/* Banners Table */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Active Banners</h3>
          {!isLoading && !isError && banners && (
            <span className="text-xs text-slate-400">
              {banners.length} banner{banners.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading banners…</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm text-slate-500">Failed to load banners.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && banners && banners.length === 0 && (
          <EmptyState icon={ImageOff} title="No banners found" />
        )}

        {!isLoading && !isError && banners && banners.length > 0 && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Position</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner, i) => (
                  <motion.tr
                    key={banner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="font-mono text-sm text-slate-500">{banner.id}</td>
                    <td className="font-semibold text-slate-800">{banner.title}</td>
                    <td className="text-slate-500">{banner.position}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        banner.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm"><Edit size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
