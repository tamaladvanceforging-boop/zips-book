"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postPaymentVoucherToAccounting, postReceiptVoucherToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface CreatePaymentInput {
  voucherNo?: string;
  date?: string;
  paymentType: "VENDOR" | "EXPENSE";
  vendorId?: string;
  vendorCode?: string;
  paidTo: string;
  purchaseBillId?: string;
  expenseAccount?: string;
  mode: string;
  amount: number;
  narration?: string;
  debitAccount?: string;
  creditAccount?: string;
  pan?: string;
  tdsApplicable?: boolean;
  tdsSection?: string;
  tdsRate?: number;
}

export interface CreateReceiptInput {
  voucherNo?: string;
  date?: string;
  receiptType: "CUSTOMER" | "INCOME";
  customerId?: string;
  customerCode?: string;
  receivedFrom: string;
  invoiceId?: string;
  incomeAccount?: string;
  mode: string;
  amount: number;
  narration?: string;
  debitAccount?: string;
  creditAccount?: string;
}

export const getPaymentVouchers = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const vouchers = await prisma.paymentVoucher.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
      include: {
        vendor: true,
        purchaseBill: true,
      },
    });
    return { success: true, data: vouchers };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch payment vouchers" };
  }
};

export const getReceiptVouchers = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const vouchers = await prisma.receiptVoucher.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
      include: {
        customer: true,
        invoice: true,
      },
    });
    return { success: true, data: vouchers };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch receipt vouchers" };
  }
};

export const createPaymentVoucher = async (data: CreatePaymentInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.paymentPrefix || "PMT-";
    const nextNo = company?.nextPaymentNo || 1;

    const voucherNo = data.voucherNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.date ? new Date(data.date) : new Date();

    const amount = Number(data.amount) || 0;
    const tdsRate = Number(data.tdsRate) || 0;
    const tdsAmount = data.tdsApplicable ? Math.round((amount * tdsRate) / 100 * 100) / 100 : 0;
    const netAmount = amount - tdsAmount;

    const debitAcc = data.debitAccount || (data.paymentType === "VENDOR" ? "Sundry Creditors" : data.expenseAccount || "Other Expenses");
    const creditAcc = data.creditAccount || (data.mode.toLowerCase().includes("cash") ? "Cash-in-Hand" : "Bank Account");

    const voucher = await prisma.paymentVoucher.create({
      data: {
        companyId,
        voucherNo,
        date,
        paymentType: data.paymentType,
        vendorId: data.vendorId || null,
        vendorCode: data.vendorCode || null,
        paidTo: data.paidTo,
        purchaseBillId: data.purchaseBillId || null,
        expenseAccount: data.expenseAccount || null,
        mode: data.mode,
        amount,
        narration: data.narration || null,
        debitAccount: debitAcc,
        creditAccount: creditAcc,
        pan: data.pan || null,
        tdsApplicable: !!data.tdsApplicable,
        tdsSection: data.tdsSection || null,
        tdsRate,
        tdsAmount,
        netAmount,
      },
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextPaymentNo: nextNo + 1 },
      });
    }

    // If payment is against purchase bill, update paid amount
    if (data.purchaseBillId) {
      await prisma.purchaseBill.update({
        where: { id: data.purchaseBillId },
        data: {
          paidAmount: { increment: amount },
        },
      });
    }

    // Post Double Entry Journal
    await postPaymentVoucherToAccounting({
      companyId,
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      paidTo: voucher.paidTo,
      paymentType: voucher.paymentType as "VENDOR" | "EXPENSE",
      amount: voucher.amount,
      mode: voucher.mode,
      debitAccount: voucher.debitAccount,
      creditAccount: voucher.creditAccount,
      narration: voucher.narration || undefined,
      tdsAmount: voucher.tdsAmount,
    });

    revalidatePath("/vouchers/payment");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");

    return { success: true, data: voucher };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create payment voucher" };
  }
};

export const createReceiptVoucher = async (data: CreateReceiptInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.receiptPrefix || "RCT-";
    const nextNo = company?.nextReceiptNo || 1;

    const voucherNo = data.voucherNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.date ? new Date(data.date) : new Date();
    const amount = Number(data.amount) || 0;

    const debitAcc = data.debitAccount || (data.mode.toLowerCase().includes("cash") ? "Cash-in-Hand" : "Bank Account");
    const creditAcc = data.creditAccount || (data.receiptType === "CUSTOMER" ? "Sundry Debtors" : data.incomeAccount || "Sales Account");

    const voucher = await prisma.receiptVoucher.create({
      data: {
        companyId,
        voucherNo,
        date,
        receiptType: data.receiptType,
        customerId: data.customerId || null,
        customerCode: data.customerCode || null,
        invoiceId: data.invoiceId || null,
        incomeAccount: data.incomeAccount || null,
        receivedFrom: data.receivedFrom,
        mode: data.mode,
        amount,
        narration: data.narration || null,
        debitAccount: debitAcc,
        creditAccount: creditAcc,
      },
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextReceiptNo: nextNo + 1 },
      });
    }

    // If receipt is against sales invoice, update paid amount
    if (data.invoiceId) {
      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: { increment: amount },
        },
      });
    }

    // Post Double Entry Journal
    await postReceiptVoucherToAccounting({
      companyId,
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      receivedFrom: voucher.receivedFrom,
      receiptType: voucher.receiptType as "CUSTOMER" | "INCOME",
      amount: voucher.amount,
      mode: voucher.mode,
      debitAccount: voucher.debitAccount,
      creditAccount: voucher.creditAccount,
      narration: voucher.narration || undefined,
    });

    revalidatePath("/vouchers/receipt");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");

    return { success: true, data: voucher };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create receipt voucher" };
  }
};
