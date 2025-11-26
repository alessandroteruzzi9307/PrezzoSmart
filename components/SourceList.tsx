import React from 'react';
import { Link2 } from 'lucide-react';
import { GroundingSource } from '../types';

interface SourceListProps {
  sources: GroundingSource[];
}

const SourceList: React.FC<SourceListProps> = ({ sources }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-slate-200">
      <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Fonti Verificate (Google Search)</h4>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, idx) => (
          <a
            key={idx}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <Link2 className="w-3 h-3" />
            <span className="truncate max-w-[200px]">{source.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default SourceList;