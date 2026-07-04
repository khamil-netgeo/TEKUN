/**
 * Core Foundation — UI Component Barrel Export
 * All 12 modules should import shared UI components from this barrel:
 *
 *   import { StatCard, AiBadge, DataTable, PageHeader, LoadingSpinner, toast, ToastContainer } from '@/components/ui';
 */

export { default as StatCard }       from './StatCard';
export { default as AiBadge }        from './AiBadge';
export { default as PageHeader }     from './PageHeader';
export { default as DataTable }      from './DataTable';
export { default as LoadingSpinner } from './LoadingSpinner';
export { InlineSpinner }             from './LoadingSpinner';
export { toast, ToastContainer }     from './Toast';

// Re-export types
export type { Column, PaginationProps } from './DataTable';
