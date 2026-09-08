"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postJournalVoucherToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface JournalLineInput {
  accountId?: string;
  accountName: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface CreateJournalInput {
  voucherNo?: string;
  date?: string;
  narration?: string;
  lines: JournalLineInput[];
}

export const createJournalVoucher = async (data: CreateJournalInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    if (!data.lines || data.lines.length < 2) {
      return { success: false, error: "A Journal entry requires at least two lines (one Debit and one Credit)." };
    }

    const totalDebit = data.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return { 
        success: false, 
        error: `Journal is not balanced! Total Debit (₹${totalDebit.toFixed(2)}) must equal Total Credit (₹${totalCredit.toFixed(2)}).` 
      };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const nextNo = (company?.nextPaymentNo || 1) + 10;
    const voucherNo = data.voucherNo || `JRN-${String(nextNo).padStart(5, "0")}`;
    const date = data.date ? new Date(data.date) : new Date();

    await postJournalVoucherToAccounting({
      companyId,
      voucherNo,
      date,
      narration: data.narration || undefined,
      lines: data.lines.map((l) => ({
        accountId: l.accountId || undefined,
        accountName: l.accountName,
        debit: Number(l.debit) || 0,
        credit: Number(l.credit) || 0,
        narration: l.narration || undefined,
      })),
    });

    revalidatePath("/vouchers/journal");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/trial-balance");

    return { success: true, voucherNo };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to post journal voucher" };
  }
};
