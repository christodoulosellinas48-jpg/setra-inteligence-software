import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const ENTITY_QUERY_MAP = {
  Business: ['businesses'],
  ExpenseDocument: ['expenses'],
  Budget: ['budgets'],
  FinancialSnapshot: ['financialSnapshots'],
  Sale: ['sales'],
  InventoryItem: ['inventory'],
  LaborShift: ['laborShifts'],
  Recipe: ['recipes'],
  Item: ['menuItems'],
  Purchase: ['purchases'],
  PurchaseOrder: ['purchaseOrders'],
  Supplier: ['suppliers'],
  EmployeeContract: ['employeeContracts'],
  Document: ['documents'],
  BankTransaction: ['bankTransactions'],
  LedgerEntry: ['ledgerEntries'],
  VATPeriod: ['vatPeriods'],
  AuditRun: ['auditRuns'],
  AuditFinding: ['auditFindings'],
  IntegrationConnection: ['integrationConnections'],
};

export default function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribers = Object.entries(ENTITY_QUERY_MAP).map(([entityName, queryKeys]) => {
      return base44.entities[entityName].subscribe(() => {
        queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: [key] }));
      });
    });

    return () => unsubscribers.forEach(unsub => unsub());
  }, [queryClient]);
}