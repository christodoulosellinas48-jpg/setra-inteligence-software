// Granular permission definitions
export const PERMISSIONS = {
  upload_expenses:    { label: 'Upload Expenses',      description: 'Upload invoices & receipts' },
  view_reports:       { label: 'View Reports',         description: 'Access financial reports & dashboards' },
  manage_vat:         { label: 'Manage VAT',           description: 'Handle VAT periods & submissions' },
  manage_bookkeeping: { label: 'Bookkeeping',          description: 'Access ledger, bank reconciliation & P&L' },
  manage_inventory:   { label: 'Manage Inventory',     description: 'View & update stock levels' },
  manage_budget:      { label: 'Manage Budgets',       description: 'Create & edit budgets' },
  manage_payroll:     { label: 'Manage Payroll',       description: 'View & process payroll & shifts' },
};

// Role presets — what each role gets by default
export const ROLE_DEFAULT_PERMISSIONS = {
  owner:      Object.keys(PERMISSIONS), // all
  manager:    ['upload_expenses', 'view_reports', 'manage_inventory', 'manage_budget', 'manage_payroll'],
  accountant: ['upload_expenses', 'view_reports', 'manage_vat', 'manage_bookkeeping'],
  viewer:     ['view_reports'],
};

export const ROLE_CONFIG = {
  owner:      { label: 'Owner',      color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  description: 'Full access to everything' },
  manager:    { label: 'Manager',    color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   description: 'Operations & financial management' },
  accountant: { label: 'Accountant', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', description: 'VAT, bookkeeping & expense handling' },
  viewer:     { label: 'Viewer',     color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-700',     description: 'Read-only dashboard access' },
};

// Parse permissions from a member record (stored as JSON string)
export function getMemberPermissions(member) {
  if (!member) return [];
  if (member.role === 'owner') return Object.keys(PERMISSIONS);
  if (member.permissions) {
    try { return JSON.parse(member.permissions); } catch { return []; }
  }
  return ROLE_DEFAULT_PERMISSIONS[member.role] || [];
}