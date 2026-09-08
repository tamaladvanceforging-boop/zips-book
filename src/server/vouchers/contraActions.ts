"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postContraVoucherToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface CreateContraInput {
  voucherNo?: string;
  date?: string;
  transferType: "CASH_TO_BANK" | "BANK_TO_CASH" | "BANK_TO_BANK";
  sourceAccount: string;
  targetAccount: string;
  amount: number;
  narration?: string;
}

export const getContraVouchers = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const vouchers = await prisma.contraVoucher.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
    });
    return { success: true, data: vouchers };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch contra vouchers" };
  }
};

export const createContraVoucher = async (data: CreateContraInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.contraPrefix || "CTR-";
    const nextNo = company?.nextContraNo || 1;

    const voucherNo = data.voucherNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.date ? new Date(data.date) : new Date();
    const amount = Number(data.amount) || 0;

    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero" };
    }

    if (data.sourceAccount === data.targetAccount) {
      return { success: false, error: "Source and Target accounts cannot be identical" };
    }

    const voucher = await prisma.contraVoucher.create({
      data: {
        companyId,
        voucherNo,
        date,
        transferType: data.transferType,
        sourceAccount: data.sourceAccount,
        targetAccount: data.targetAccount,
        amount,
        narration: data.narration || null,
      },
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextContraNo: nextNo + 1 },
      });
    }

    await postContraVoucherToAccounting({
      companyId,
      voucherNo: voucher.voucherNo,
      date: voucher.date,
      sourceAccount: voucher.sourceAccount,
      targetAccount: voucher.targetAccount,
      amount: voucher.amount,
      narration: voucher.narration || undefined,
    });

    revalidatePath("/vouchers/contra");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/trial-balance");

    return { success: true, data: voucher };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to record contra voucher" };
  }
};
