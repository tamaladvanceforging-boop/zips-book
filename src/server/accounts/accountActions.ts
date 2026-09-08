"use server";

import prisma from "@/lib/dbClient/prisma";
import { revalidatePath } from "next/cache";

export interface AccountInput {
  id?: string;
  code: string;
  name: string;
  type: string;
  category: string;
  openingDr?: number;
  openingCr?: number;
}

export async function getAccounts() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { code: "asc" },
      include: {
        journalLines: {
          select: { debit: true, credit: true },
        },
      },
    });

    const enriched = accounts.map((acc) => {
      const periodDr = acc.journalLines.reduce((sum, l) => sum + l.debit, 0);
      const periodCr = acc.journalLines.reduce((sum, l) => sum + l.credit, 0);
      const totalDr = acc.openingDr + periodDr;
      const totalCr = acc.openingCr + periodCr;

      let closingDr = 0;
      let closingCr = 0;

      if (totalDr >= totalCr) {
        closingDr = totalDr - totalCr;
      } else {
        closingCr = totalCr - totalDr;
      }

      return {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        openingDr: acc.openingDr,
        openingCr: acc.openingCr,
        periodDr,
        periodCr,
        closingDr,
        closingCr,
        isSystem: acc.isSystem,
      };
    });

    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch accounts" };
  }
}

export async function createAccount(data: AccountInput) {
  try {
    const account = await prisma.account.create({
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        type: data.type.trim(),
        category: data.category.trim(),
        openingDr: Number(data.openingDr) || 0,
        openingCr: Number(data.openingCr) || 0,
        isSystem: false,
      },
    });
    revalidatePath("/masters/accounts");
    return { success: true, data: account };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create account" };
  }
}

export async function updateAccount(id: string, data: AccountInput) {
  try {
    const account = await prisma.account.update({
      where: { id },
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        type: data.type.trim(),
        category: data.category.trim(),
        openingDr: Number(data.openingDr) || 0,
        openingCr: Number(data.openingCr) || 0,
      },
    });
    revalidatePath("/masters/accounts");
    return { success: true, data: account };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update account" };
  }
}
