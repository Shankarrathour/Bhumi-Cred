import React from 'react';
import { FileText, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, Chip } from '@mui/material';

const MOCK_CONTENT = [
  { id: 'ART-001', title: 'How to Plant Teak Trees', category: 'Training', status: 'Published', date: '2026-08-01' },
  { id: 'ART-002', title: 'Monsoon Advisory 2026', category: 'Announcement', status: 'Draft', date: '2026-08-04' },
  { id: 'ART-003', title: 'Carbon Credit Guidelines', category: 'Knowledge Base', status: 'Published', date: '2026-07-28' },
];

export const CmsDashboard = () => {
  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="CMS & Content Management"
        description="Manage knowledge base articles, training materials, and platform announcements."
        icon={FileText}
        actions={<Button variant="contained" color="primary" startIcon={<Plus size={16}/>}>Create Content</Button>}
      />

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Published & Draft Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date Modified</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_CONTENT.map((item) => (
                <tr key={item.id}>
                  <td className="font-mono text-sm text-slate-500">{item.id}</td>
                  <td className="font-semibold text-slate-800">{item.title}</td>
                  <td><Chip label={item.category} size="small" variant="outlined" /></td>
                  <td>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${item.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="text-slate-500 text-sm">{item.date}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm"><Eye size={14}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm"><Edit size={14}/></button>
                      <button className="btn btn-ghost btn-icon btn-sm text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
