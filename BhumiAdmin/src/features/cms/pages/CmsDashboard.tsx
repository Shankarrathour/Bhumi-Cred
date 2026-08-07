import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Edit, Plus, AlertCircle, Loader2, ImageOff, X, Save, Trash2, Link as LinkIcon, Sparkles } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '@mui/material';
import { useBanners, useCmsDashboard } from '../api/useCms';
import { apiClient } from '../../../api/axios';
import toast from 'react-hot-toast';

export const CmsDashboard: React.FC = () => {
  const { data: banners, isLoading, isError, refetch } = useBanners();
  const { data: cmsDashboard } = useCmsDashboard();

  // Modal / Drawer states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBannerForView, setSelectedBannerForView] = useState<any | null>(null);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('/programs');
  const [priority, setPriority] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form
  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setLinkUrl('/programs');
    setPriority(1);
    setIsActive(true);
    setEditingBanner(null);
  };

  // Open Edit modal with data
  const handleOpenEdit = (banner: any) => {
    setEditingBanner(banner);
    setTitle(banner.title || '');
    setImageUrl(banner.image_url || banner.imageUrl || '');
    setLinkUrl(banner.link_url || banner.linkUrl || '/programs');
    setPriority(banner.priority ?? banner.position ?? 1);
    setIsActive(banner.is_active ?? true);
  };

  // Create Banner submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Title and Image URL are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/admin/banners', {
        title: title.trim(),
        image_url: imageUrl.trim(),
        link_url: linkUrl.trim(),
        priority: Number(priority),
        is_active: isActive
      });
      toast.success('Promotional banner created successfully!');
      setIsCreateOpen(false);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Banner submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    if (!title.trim() || !imageUrl.trim()) {
      toast.error('Title and Image URL are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.put(`/admin/banners/${editingBanner.id}`, {
        title: title.trim(),
        image_url: imageUrl.trim(),
        link_url: linkUrl.trim(),
        priority: Number(priority),
        is_active: isActive
      });
      toast.success('Banner updated successfully!');
      setEditingBanner(null);
      resetForm();
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update banner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Banner
  const handleDelete = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      await apiClient.delete(`/admin/banners/${bannerId}`);
      toast.success('Banner deleted successfully!');
      if (selectedBannerForView?.id === bannerId) setSelectedBannerForView(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to delete banner.');
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="CMS & Content Management"
        description="Manage banners, homepage config, and platform content."
        icon={FileText}
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={<Plus size={16} />}
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
          >
            Create Content
          </Button>
        }
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
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles size={16} className="text-emerald-500" /> Active Banners
          </h3>
          {!isLoading && !isError && banners && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {banners.length} banner{banners.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin text-emerald-500" />
            <span className="text-sm font-medium">Loading banners…</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm text-slate-500 font-medium">Failed to load banners.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && banners && banners.length === 0 && (
          <EmptyState icon={ImageOff} title="No banners found" />
        )}

        {!isLoading && !isError && banners && banners.length > 0 && (
          <div className="overflow-x-auto">
            <table className="ent-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Banner Preview</th>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner: any, i: number) => (
                  <motion.tr
                    key={banner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="font-mono text-xs text-slate-500 max-w-[110px] truncate" title={String(banner.id)}>{banner.id}</td>
                    <td>
                      {banner.image_url || banner.imageUrl ? (
                        <img
                          src={banner.image_url || banner.imageUrl}
                          alt={banner.title || 'Banner'}
                          className="h-10 w-24 object-cover rounded-md border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">No image</span>
                      )}
                    </td>
                    <td className="font-semibold text-slate-800 text-xs">{banner.title || 'Untitled Banner'}</td>
                    <td className="text-slate-600 text-xs font-mono font-bold">Priority: {banner.priority ?? banner.position ?? 1}</td>
                    <td>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                        banner.is_active
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setSelectedBannerForView(banner)}
                          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
                          title="View Banner Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(banner)}
                          className="p-1.5 hover:bg-indigo-50 rounded-md text-indigo-600 transition-colors"
                          title="Edit Banner"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(String(banner.id))}
                          className="p-1.5 hover:bg-red-50 rounded-md text-red-600 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE BANNER MODAL ── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans"
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Plus size={18} className="text-emerald-600" /> Create New Banner Content
                </h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-800">Banner Title *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Monsoon Reforestation Campaign"
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 font-sans"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-800">Image URL *</label>
                  <input
                    required
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 font-sans"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                </div>

                {imageUrl && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 block">Preview</label>
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="h-24 w-full object-cover rounded-lg border border-slate-200"
                      onError={() => toast.error('Invalid image URL preview')}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block text-slate-800">Link URL / Redirect Path</label>
                    <input
                      type="text"
                      placeholder="/programs"
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 font-sans"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block text-slate-800">Priority (1 = Top)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 font-sans"
                      value={priority}
                      onChange={e => setPriority(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-800">Banner Visibility Status</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">{isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Save size={15} />
                    {isSubmitting ? 'Creating...' : 'Create Content'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT BANNER MODAL ── */}
      <AnimatePresence>
        {editingBanner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans"
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Edit size={18} className="text-indigo-600" /> Edit Banner Content
                </h3>
                <button onClick={() => resetForm()} className="p-1 hover:bg-slate-200 rounded-md text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4 text-xs text-slate-700">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-800">Banner Title *</label>
                  <input
                    required
                    type="text"
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 font-sans"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-800">Image URL *</label>
                  <input
                    required
                    type="url"
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 font-sans"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                </div>

                {imageUrl && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-500 block">Preview</label>
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="h-24 w-full object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold block text-slate-800">Link URL / Redirect Path</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 font-sans"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block text-slate-800">Priority (1 = Top)</label>
                    <input
                      type="number"
                      min={1}
                      className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 font-sans"
                      value={priority}
                      onChange={e => setPriority(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-semibold text-slate-800">Banner Visibility Status</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">{isActive ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => resetForm()}
                    className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Save size={15} />
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── VIEW BANNER MODAL ── */}
      <AnimatePresence>
        {selectedBannerForView && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden font-sans"
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Eye size={18} className="text-emerald-600" /> Banner Content Details
                </h3>
                <button onClick={() => setSelectedBannerForView(null)} className="p-1 hover:bg-slate-200 rounded-md text-slate-500">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="aspect-[3/1] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                  <img
                    src={selectedBannerForView.image_url || selectedBannerForView.imageUrl}
                    alt={selectedBannerForView.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Banner Title:</span>
                    <span className="font-bold text-slate-800 text-sm">{selectedBannerForView.title || 'Untitled'}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Banner ID:</span>
                    <span className="font-mono text-slate-700">{selectedBannerForView.id}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Target Hyperlink:</span>
                    <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
                      <LinkIcon size={12} />
                      {selectedBannerForView.link_url || selectedBannerForView.linkUrl || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Priority Order:</span>
                    <span className="font-bold text-slate-800">Priority {selectedBannerForView.priority ?? selectedBannerForView.position ?? 1}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Visibility Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedBannerForView.is_active
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {selectedBannerForView.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => {
                      const bannerToEdit = selectedBannerForView;
                      setSelectedBannerForView(null);
                      handleOpenEdit(bannerToEdit);
                    }}
                    className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <Edit size={14} /> Edit Banner
                  </button>
                  <button
                    onClick={() => setSelectedBannerForView(null)}
                    className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

