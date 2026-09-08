// Core Tally-Style Double-Entry Accounting Engine for ZIPS-Book
import prisma from "./dbClient/prisma";

export interface InvoicePostingPayload {
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
  voucherNo: string;
  date?: Date;
  paidTo: string;
  paymentType: "VENDOR" | "EXPENSE";
  amount: number;
  mode: string;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
  tdsAmount?: number;
}

export interface ReceiptPostingPayload {
  voucherNo: string;
  date?: Date;
  receivedFrom: string;
  receiptType: "CUSTOMER" | "INCOME";
  amount: number;
  mode: string;
  debitAccount: string;
  creditAccount: string;
  narration?: string;
}

/**
 * Post Sales Invoice to Day Book (Journal) and update inventory stock
 */
export async function postSalesInvoiceToAccounting(payload: InvoicePostingPayload) {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  // 1. Create Double-Entry Journal
  await prisma.journalEntry.create({
    data: {
      voucherType: "Sales",
      voucherNo: payload.invoiceNo,
      referenceId: payload.invoiceId,
      entryDate: payload.date || new Date(),
      narration: `Sales Invoice ${payload.invoiceNo} - ${payload.customerName}`,
      lines: {
        create: [
          {
            accountName: "Sundry Debtors",
            debit: payload.totalAmount,
            credit: 0,
            narration: `Receivable from ${payload.customerName}`,
          },
          {
            accountName: "Sales Account",
            debit: 0,
            credit: payload.taxableValue,
            narration: `Sales Revenue (Taxable)`,
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: "GST Payable",
                  debit: 0,
                  credit: totalTax,
                  narration: `Output GST Liability`,
                },
              ]
            : []),
        ],
      },
    },
  });

  // 2. Reduce Stock Quantity for inventory tracking
  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { decrement: itm.qty } },
      });
    }
  }
}

/**
 * Post Purchase Bill to Day Book (Journal) and update inventory stock
 */
export async function postPurchaseBillToAccounting(payload: PurchasePostingPayload) {
  const totalTax = payload.cgstAmount + payload.sgstAmount + payload.igstAmount;

  // 1. Create Double-Entry Journal
  await prisma.journalEntry.create({
    data: {
      voucherType: "Purchase",
      voucherNo: payload.voucherNo,
      referenceId: payload.purchaseBillId,
      entryDate: payload.date || new Date(),
      narration: `Purchase Bill ${payload.voucherNo} - ${payload.vendorName}`,
      lines: {
        create: [
          {
            accountName: "Purchase Account",
            debit: payload.taxableValue,
            credit: 0,
            narration: `Purchase Cost (Taxable)`,
          },
          ...(totalTax > 0
            ? [
                {
                  accountName: "GST Input Credit",
                  debit: totalTax,
                  credit: 0,
                  narration: `Input Tax Credit (ITC)`,
                },
              ]
            : []),
          {
            accountName: "Sundry Creditors",
            debit: 0,
            credit: payload.totalAmount,
            narration: `Payable to ${payload.vendorName}`,
          },
        ],
      },
    },
  });

  // 2. Increase Stock Quantity for inventory tracking
  for (const itm of payload.items) {
    if (itm.itemId) {
      await prisma.item.update({
        where: { id: itm.itemId },
        data: { stockQty: { increment: itm.qty } },
      });
    }
  }
}

/**
 * Post Payment Voucher to Day Book (Journal)
 */
export async function postPaymentVoucherToAccounting(payload: PaymentPostingPayload) {
  const lines: { accountName: string; debit: number; credit: number; narration?: string }[] = [];

  // Debit target (Sundry Creditors or Expense Account)
  lines.push({
    accountName: payload.debitAccount,
    debit: payload.amount,
    credit: 0,
    narration: payload.narration || `Paid to ${payload.paidTo}`,
  });

  // Credit source (Cash or Bank)
  const tds = payload.tdsAmount || 0;
  const netPaid = payload.amount - tds;

  lines.push({
    accountName: payload.creditAccount,
    debit: 0,
    credit: netPaid,
    narration: `Payment via ${payload.mode}`,
  });

  if (tds > 0) {
    lines.push({
      accountName: "TDS Payable",
      debit: 0,
      credit: tds,
      narration: `TDS Deducted`,
    });
  }

  await prisma.journalEntry.create({
    data: {
      voucherType: "Payment",
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || `Payment to ${payload.paidTo}`,
      lines: {
        create: lines,
      },
    },
  });
}

/**
 * Post Receipt Voucher to Day Book (Journal)
 */
export async function postReceiptVoucherToAccounting(payload: ReceiptPostingPayload) {
  await prisma.journalEntry.create({
    data: {
      voucherType: "Receipt",
      voucherNo: payload.voucherNo,
      entryDate: payload.date || new Date(),
      narration: payload.narration || `Received from ${payload.receivedFrom}`,
      lines: {
        create: [
          {
            accountName: payload.debitAccount,
            debit: payload.amount,
            credit: 0,
            narration: `Received via ${payload.mode}`,
          },
          {
            accountName: payload.creditAccount,
            debit: 0,
            credit: payload.amount,
            narration: `Credit to ${payload.receivedFrom}`,
          },
        ],
      },
    },
  });
}
