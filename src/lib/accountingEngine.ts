// Core Double-Entry Accounting Engine for ZIPS-Book (Multi-Company ERP)
import prisma from '@/lib/dbClient/dbClient';

export interface InvoicePostingPayload {
  companyId: string;
  invoiceId: string;
  invoiceNo: string;
  customerName: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  date?: Date;
  items: { itemId?: string | null; qty: number }[];
}

export interface PurchasePostingPayload {
  companyId: string;
  purchaseBillId: string;
  voucherNo: string;
  vendorName: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  date?: Date;
  items: { itemId?: string | null; qty: number }[];
}

export interface PaymentPostingPayload {
  companyId: string;
  voucherNo: string;
  date?: Date;
  paidTo: string;
  paymentType: 'VENDOR' | 'EXPENSE';
  amount: number;
  mode: string;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
  tdsAmount?: number;
}

export interface ReceiptPostingPayload {
  companyId: string;
  voucherNo: string;
  date?: Date;
  receivedFrom: string;
  receiptType: 'CUSTOMER' | 'INCOME';
  amount: number;
  mode: string;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
}

export interface CreditNotePostingPayload {
  companyId: string;
  creditNoteId: string;
  noteNo: string;
  customerName: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  date?: Date;
  items: { itemId?: string | null; qty: number }[];
}

export interface DebitNotePostingPayload {
  companyId: string;
  debitNoteId: string;
  noteNo: string;
  vendorName: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
  date?: Date;
  items: { itemId?: string | null; qty: number }[];
}

export interface ContraPostingPayload {
  companyId: string;
  voucherNo: string;
  date?: Date;
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  narration?: string;
}

export interface JournalPostingPayload {
  companyId: string;
  voucherNo: string;
  date?: Date;
  narration?: string;
  lines: {
    accountId?: string;
    accountName: string;
    debit: number;
    credit: number;
    narration?: string;
  }[];
}

/**
 * Post Sales Invoice to Day Book (Journal) and update inventory stock
 */
export const postSalesInvoiceToAccounting = async (payload: InvoicePostingPayload) => {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Sales',
      voucherNo: payload.invoiceNo,
      referenceId: payload.invoiceId,
      entryDate: payload.date || new Date(),
      narration: 'Sales Invoice ' + payload.invoiceNo + ' - ' + payload.customerName,
      lines: {
        create: [
          {
            accountName: 'Sundry Debtors',
            debit: payload.totalAmount,
            credit: 0,
            narration: 'Receivable from ' + payload.customerName,
          },
          {
            accountName: 'Sales Account',
            debit: 0,
            credit: payload.taxableValue,
            narration: 'Sales Revenue (Taxable)',
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: 'GST Payable',
                  debit: 0,
                  credit: totalTax,
                  narration: 'Output GST Liability',
                },
              ]
            : []),
        ],
      },
    },
  });

  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { decrement: itm.qty } },
      });
    }
  }
};

/**
 * Post Purchase Bill to Day Book (Journal) and update inventory stock
 */
export const postPurchaseBillToAccounting = async (payload: PurchasePostingPayload) => {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Purchase',
      voucherNo: payload.voucherNo,
      referenceId: payload.purchaseBillId,
      entryDate: payload.date || new Date(),
      narration: 'Purchase Bill ' + payload.voucherNo + ' - ' + payload.vendorName,
      lines: {
        create: [
          {
            accountName: 'Purchase Account',
            debit: payload.taxableValue,
            credit: 0,
            narration: 'Purchase Cost (Taxable)',
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: 'GST Input Credit',
                  debit: totalTax,
                  credit: 0,
                  narration: 'Input Tax Credit (ITC)',
                },
              ]
            : []),
          {
            accountName: 'Sundry Creditors',
            debit: 0,
            credit: payload.totalAmount,
            narration: 'Payable to ' + payload.vendorName,
          },
        ],
      },
    },
  });

  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { increment: itm.qty } },
      });
    }
  }
};

/**
 * Post Payment Voucher to Day Book (Journal)
 */
export const postPaymentVoucherToAccounting = async (payload: PaymentPostingPayload) => {
  const lines: { accountName: string; debit: number; credit: number; narration?: string }[] = [];

  lines.push({
    accountName: payload.debitAccount,
    debit: payload.amount,
    credit: 0,
    narration: payload.narration || 'Paid to ' + payload.paidTo,
  });

  const tds = payload.tdsAmount || 0;
  const netPaid = payload.amount - tds;

  lines.push({
    accountName: payload.creditAccount,
    debit: 0,
    credit: netPaid,
    narration: 'Payment via ' + payload.mode,
  });

  if (tds > 0) {
    lines.push({
      accountName: 'TDS Payable',
      debit: 0,
      credit: tds,
      narration: 'TDS Deducted',
    });
  }

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Payment',
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || 'Payment to ' + payload.paidTo,
      lines: {
        create: lines,
      },
    },
  });
};

/**
 * Post Receipt Voucher to Day Book (Journal)
 */
export const postReceiptVoucherToAccounting = async (payload: ReceiptPostingPayload) => {
  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Receipt',
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || 'Received from ' + payload.receivedFrom,
      lines: {
        create: [
          {
            accountName: payload.debitAccount,
            debit: payload.amount,
            credit: 0,
            narration: 'Received via ' + payload.mode,
          },
          {
            accountName: payload.creditAccount,
            debit: 0,
            credit: payload.amount,
            narration: 'Credit to ' + payload.receivedFrom,
          },
        ],
      },
    },
  });
};

/**
 * Post Credit Note (Sales Return) to Day Book & Restock Inventory
 */
export const postCreditNoteToAccounting = async (payload: CreditNotePostingPayload) => {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Credit Note',
      voucherNo: payload.noteNo,
      referenceId: payload.creditNoteId,
      entryDate: payload.date || new Date(),
      narration: 'Credit Note (Sales Return) ' + payload.noteNo + ' - ' + payload.customerName,
      lines: {
        create: [
          {
            accountName: 'Sales Return Account',
            debit: payload.taxableValue,
            credit: 0,
            narration: 'Sales Return / Value Reversal',
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: 'GST Payable',
                  debit: totalTax,
                  credit: 0,
                  narration: 'Output GST Reversal on Return',
                },
              ]
            : []),
          {
            accountName: 'Sundry Debtors',
            debit: 0,
            credit: payload.totalAmount,
            narration: 'Credit adjustment to ' + payload.customerName,
          },
        ],
      },
    },
  });

  // Restock inventory for returned items
  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { increment: itm.qty } },
      });
    }
  }
};

/**
 * Post Debit Note (Purchase Return) to Day Book & Reduce Inventory
 */
export const postDebitNoteToAccounting = async (payload: DebitNotePostingPayload) => {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Debit Note',
      voucherNo: payload.noteNo,
      referenceId: payload.debitNoteId,
      entryDate: payload.date || new Date(),
      narration: 'Debit Note (Purchase Return) ' + payload.noteNo + ' - ' + payload.vendorName,
      lines: {
        create: [
          {
            accountName: 'Sundry Creditors',
            debit: payload.totalAmount,
            credit: 0,
            narration: 'Debit adjustment to ' + payload.vendorName,
          },
          {
            accountName: 'Purchase Return Account',
            debit: 0,
            credit: payload.taxableValue,
            narration: 'Purchase Return / Value Reversal',
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: 'GST Input Credit',
                  debit: 0,
                  credit: totalTax,
                  narration: 'Input Tax Credit Reversal on Return',
                },
              ]
            : []),
        ],
      },
    },
  });

  // Deduct inventory for returned items
  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { decrement: itm.qty } },
      });
    }
  }
};

/**
 * Post Contra Voucher (F4) - Internal Cash & Bank Transfers
 */
export const postContraVoucherToAccounting = async (payload: ContraPostingPayload) => {
  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Contra',
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || 'Contra transfer: ' + payload.sourceAccount + ' to ' + payload.targetAccount,
      lines: {
        create: [
          {
            accountName: payload.targetAccount,
            debit: payload.amount,
            credit: 0,
            narration: 'Funds received into ' + payload.targetAccount,
          },
          {
            accountName: payload.sourceAccount,
            debit: 0,
            credit: payload.amount,
            narration: 'Funds transferred out from ' + payload.sourceAccount,
          },
        ],
      },
    },
  });
};

/**
 * Post General Journal Voucher (F7) - Multi-ledger Adjustments
 */
export const postJournalVoucherToAccounting = async (payload: JournalPostingPayload) => {
  const totalDebit = payload.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = payload.lines.reduce((s, l) => s + l.credit, 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Total Debit must equal Total Credit. Debit: ' + totalDebit + ', Credit: ' + totalCredit);
  }

  await prisma.journalEntry.create({
    data: {
      companyId: payload.companyId,
      voucherType: 'Journal',
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || 'Journal adjustment voucher ' + payload.voucherNo,
      lines: {
        create: payload.lines.map((l) => ({
          accountId: l.accountId || null,
          accountName: l.accountName,
          debit: l.debit,
          credit: l.credit,
          narration: l.narration || undefined,
        })),
      },
    },
  });
};
