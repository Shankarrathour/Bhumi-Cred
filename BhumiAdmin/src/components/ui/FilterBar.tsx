import React from 'react';
import { Search, SlidersHorizontal, Download, Upload, RefreshCw, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  filters?: Array<{
    key: string;
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (v: string) => void;
  }>;
  onExport?: () => void;
  onImport?: () => void;
  onRefresh?: () => void;
  extraActions?: React.ReactNode;
  resultCount?: number;
  loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search, onSearchChange, searchPlaceholder = 'Search...',
  filters = [], onExport, onImport, onRefresh,
  extraActions, resultCount, loading = false,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2.5 mb-4">
      {/* Search */}
      {onSearchChange !== undefined && (
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="ent-input pl-9"
          />
        </div>
      )}

      {/* Filter dropdowns */}
      {filters.map(f => (
        <div key={f.key} className="relative">
          <select
            value={f.value}
            onChange={e => f.onChange(e.target.value)}
            className="ent-input ent-select appearance-none pr-8 min-w-[130px] cursor-pointer"
          >
            <option value="">{f.label}</option>
            {f.options.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Result count */}
      {resultCount !== undefined && (
        <span className="text-[12px] text-[#94A3B8]">
          {loading ? '...' : `${resultCount.toLocaleString()} results`}
        </span>
      )}

      {/* Actions */}
      {extraActions}

      {onImport && (
        <button onClick={onImport} className="btn btn-secondary btn-sm gap-1.5">
          <Upload size={13} />
          Import
        </button>
      )}
      {onExport && (
        <button onClick={onExport} className="btn btn-secondary btn-sm gap-1.5">
          <Download size={13} />
          Export
        </button>
      )}
      {onRefresh && (
        <button onClick={onRefresh} className={`btn btn-ghost btn-icon btn-sm ${loading ? 'pointer-events-none' : ''}`}>
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#16A34A]' : 'text-[#64748B]'} />
        </button>
      )}
    </div>
  );
};
