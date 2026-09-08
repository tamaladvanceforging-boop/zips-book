"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postDebitNoteToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface DebitNoteItemInput {
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

export interface CreateDebitNoteInput {
  noteNo?: string;
  noteDate?: string;
  originalBillNo?: string;
  originalBillDate?: string;
  vendorId?: string;
  vendorName: string;
  vendorGstin?: string;
  vendorState?: string;
  vendorStateCode?: string;
  supplyType: string;
  reason: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff?: number;
  totalAmount: number;
  notes?: string;
  items: DebitNoteItemInput[];
}

export const getDebitNotes = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const notes = await prisma.debitNote.findMany({
      where: { companyId },
      orderBy: { noteDate: "desc" },
      include: {
        items: true,
        vendor: true,
      },
    });
    return { success: true, data: notes };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch debit notes" };
  }
};

export const createDebitNote = async (data: CreateDebitNoteInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.debitNotePrefix || "DBN-";
    const nextNo = company?.nextDebitNoteNo || 1;

    const noteNo = data.noteNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.noteDate ? new Date(data.noteDate) : new Date();

    const note = await prisma.debitNote.create({
      data: {
        companyId,
        noteNo,
        noteDate: date,
        originalBillNo: data.originalBillNo || null,
        originalBillDate: data.originalBillDate ? new Date(data.originalBillDate) : null,
        vendorId: data.vendorId || null,
        vendorName: data.vendorName,
        vendorGstin: data.vendorGstin || null,
        vendorState: data.vendorState || null,
        vendorStateCode: data.vendorStateCode || null,
        supplyType: data.supplyType,
        reason: data.reason || "Purchase Return",
        taxableValue: data.taxableValue,
        cgstAmount: data.cgstAmount,
        sgstAmount: data.sgstAmount,
        igstAmount: data.igstAmount,
        roundOff: data.roundOff || 0,
        totalAmount: data.totalAmount,
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

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextDebitNoteNo: nextNo + 1 },
      });
    }

    await postDebitNoteToAccounting({
      companyId,
      debitNoteId: note.id,
      noteNo: note.noteNo,
      vendorName: note.vendorName,
      taxableValue: note.taxableValue,
      cgstAmount: note.cgstAmount,
      sgstAmount: note.sgstAmount,
      igstAmount: note.igstAmount,
      totalAmount: note.totalAmount,
      date: note.noteDate,
      items: data.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
    });

    revalidatePath("/vouchers/debit-note");
    revalidatePath("/registers/debit-notes");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");
    revalidatePath("/reports/gst-summary");

    return { success: true, data: note };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create debit note" };
  }
};
