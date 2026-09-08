"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postPurchaseBillToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface PurchaseItemInput {
  itemId?: string;
  itemCode: string;
  itemName: string;
  hsnSac: string;
  unit: string;
  qty: number;
  rate: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface CreatePurchaseInput {
  voucherNo?: string;
  vendorBillNo?: string;
  billDate?: string;
  vendorId?: string;
  vendorName: string;
  vendorAddress?: string;
  vendorGstin?: string;
  vendorState?: string;
  vendorStateCode?: string;
  supplyType: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff?: number;
  totalAmount: number;
  notes?: string;
  items: PurchaseItemInput[];
}

export const getPurchases = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const bills = await prisma.purchaseBill.findMany({
      where: { companyId },
      orderBy: { billDate: "desc" },
      include: {
        items: true,
        vendor: true,
        payments: true,
      },
    });
    return { success: true, data: bills };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch purchase bills" };
  }
};

export const createPurchase = async (data: CreatePurchaseInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.purchasePrefix || "PUR-";
    const nextNo = company?.nextPurchaseNo || 1;

    const voucherNo = data.voucherNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.billDate ? new Date(data.billDate) : new Date();

    const purchase = await prisma.purchaseBill.create({
      data: {
        companyId,
        voucherNo,
        vendorBillNo: data.vendorBillNo || null,
        billDate: date,
        vendorId: data.vendorId || null,
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress || null,
        vendorGstin: data.vendorGstin || null,
        vendorState: data.vendorState || null,
        vendorStateCode: data.vendorStateCode || null,
        supplyType: data.supplyType,
        taxableValue: data.taxableValue,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount,
        roundOff: data.roundOff || 0,
        totalAmount: data.totalAmount,
        paidAmount: 0,
        status: "POSTED",
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId || null,
            itemCode: item.itemCode,
            itemName: item.itemName,
            hsnSac: item.hsnSac,
            unit: item.unit || "PCS",
            qty: item.qty,
            rate: item.rate,
            taxableValue: item.taxableValue,
            gstRate: item.gstRate,
            cgstAmount: item.cgstAmount,
            sgstAmount: item.sgstAmount,
            igstAmount: item.igstAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
    });

    // Update Company nextPurchaseNo counter
    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextPurchaseNo: nextNo + 1 },
      });
    }

    // Post Double Entry Journal & increase inventory
    await postPurchaseBillToAccounting({
      companyId,
      purchaseBillId: purchase.id,
      voucherNo: purchase.voucherNo,
      vendorName: purchase.vendorName,
      taxableValue: purchase.taxableValue,
      cgstAmount: purchase.cgstAmount,
      sgstAmount: purchase.sgstAmount,
      igstAmount: purchase.igstAmount,
      totalAmount: purchase.totalAmount,
      date: purchase.billDate,
      items: data.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
    });

    revalidatePath("/registers/purchase");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");
    revalidatePath("/reports/gst-summary");

    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create purchase bill" };
  }
};

export const deletePurchase = async (id: string) => {
  try {
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!bill) return { success: false, error: "Purchase bill not found" };

    // Reduce stock
    for (const itm of bill.items) {
      if (itm.itemId) {
        await prisma.item.update({
          where: { id: itm.itemId },
          data: { stockQty: { decrement: itm.qty } },
        });
      }
    }

    // Delete corresponding journal entries
    await prisma.journalEntry.deleteMany({
      where: { referenceId: id },
    });

    await prisma.purchaseBill.delete({ where: { id } });

    revalidatePath("/registers/purchase");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete purchase bill" };
  }
};
