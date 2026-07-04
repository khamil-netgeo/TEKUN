/**
 * Core Foundation — PageHeader
 * Consistent page title + breadcrumb + optional action button.
 * Used at the top of every page across all 12 modules.
 */
import React, { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title:        string;
  subtitle?:    string;
  breadcrumbs?: Breadcrumb[];
  action?:      ReactNode;
  icon?:        ReactNode;
}

export default function PageHeader({
  title, subtitle, breadcrumbs, action, icon,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
            style={{ background: '#EEF1FA' }}
          >
            <span style={{ color: '#1B2B5E' }}>{icon}</span>
          </div>
        )}
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 mb-1" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <ChevronRight size={10} className="text-gray-300 flex-shrink-0" />
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5E' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
}
