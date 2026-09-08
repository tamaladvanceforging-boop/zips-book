import { cookies } from 'next/headers';
import prisma from '@/lib/dbClient/dbClient';

export const ACTIVE_COMPANY_COOKIE = 'zips_active_company_id';

export const getActiveCompanyId = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const companyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;

  if (companyId) {
    const existing = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (existing) return existing.id;
  }

  // Fallback: Pick first available company if any exists
  const firstCompany = await prisma.company.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (firstCompany) {
    cookieStore.set(ACTIVE_COMPANY_COOKIE, firstCompany.id, {
      path: '/',
      sameSite: 'lax',
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    return firstCompany.id;
  }

  return null;
};

export const setActiveCompanyId = async (companyId: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    path: '/',
    sameSite: 'lax',
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  });
};

export const clearActiveCompanyId = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_COMPANY_COOKIE);
};

export const seedStandardChartOfAccounts = async (companyId: string) => {
  const standardAccounts = [
    { code: 'CASH-01', name: 'Cash-in-Hand', type: 'Asset', category: 'Current Assets', isSystem: true },
    { code: 'BANK-01', name: 'State Bank of India / Primary Bank', type: 'Asset', category: 'Bank Accounts', isSystem: true },
    { code: 'DEBTOR-CTRL', name: 'Sundry Debtors', type: 'Asset', category: 'Current Assets', isSystem: true },
    { code: 'CGST-IN', name: 'CGST Input Credit', type: 'Asset', category: 'Duties & Taxes', isSystem: true },
    { code: 'SGST-IN', name: 'SGST Input Credit', type: 'Asset', category: 'Duties & Taxes', isSystem: true },
    { code: 'IGST-IN', name: 'IGST Input Credit', type: 'Asset', category: 'Duties & Taxes', isSystem: true },
    { code: 'CREDITOR-CTRL', name: 'Sundry Creditors', type: 'Liability', category: 'Current Liabilities', isSystem: true },
    { code: 'CGST-OUT', name: 'CGST Output Payable', type: 'Liability', category: 'Duties & Taxes', isSystem: true },
    { code: 'SGST-OUT', name: 'SGST Output Payable', type: 'Liability', category: 'Duties & Taxes', isSystem: true },
    { code: 'IGST-OUT', name: 'IGST Output Payable', type: 'Liability', category: 'Duties & Taxes', isSystem: true },
    { code: 'TDS-194Q', name: 'TDS Payable u/s 194Q', type: 'Liability', category: 'Duties & Taxes', isSystem: true },
    { code: 'CAPITAL-01', name: 'Capital Account', type: 'Equity', category: 'Capital', isSystem: true },
    { code: 'PL-RESERVE', name: 'Retained Earnings / P&L Reserve', type: 'Equity', category: 'Reserves & Surplus', isSystem: true },
    { code: 'SALES-01', name: 'Sales Account (Domestic)', type: 'Revenue', category: 'Sales Accounts', isSystem: true },
    { code: 'PURCHASE-01', name: 'Purchase Account', type: 'Expense', category: 'Purchase Accounts', isSystem: true },
    { code: 'EXP-FREIGHT', name: 'Freight & Transportation Inward', type: 'Expense', category: 'Direct Expenses', isSystem: false },
    { code: 'EXP-OFFICE', name: 'Office & Administrative Expenses', type: 'Expense', category: 'Indirect Expenses', isSystem: false },
  ];

  for (const acc of standardAccounts) {
    await prisma.account.upsert({
      where: {
        companyId_code: {
          companyId,
          code: acc.code,
        },
      },
      update: {},
      create: {
        companyId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        isSystem: acc.isSystem,
      },
    });
  }
};
