"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postCreditNoteToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface CreditNoteItemInput {
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

export interface CreateCreditNoteInput {
  noteNo?: string;
  noteDate?: string;
  originalInvoiceNo?: string;
  originalInvoiceDate?: string;
  customerId?: string;
  customerName: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;
  supplyType: string;
  reason: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff?: number;
  totalAmount: number;
  notes?: string;
  items: CreditNoteItemInput[];
}

export const getCreditNotes = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const notes = await prisma.creditNote.findMany({
      where: { companyId },
      orderBy: { noteDate: "desc" },
      include: {
        items: true,
        customer: true,
      },
    });
    return { success: true, data: notes };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch credit notes" };
  }
};

export const createCreditNote = async (data: CreateCreditNoteInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.creditNotePrefix || "CRN-";
    const nextNo = company?.nextCreditNoteNo || 1;

    const noteNo = data.noteNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.noteDate ? new Date(data.noteDate) : new Date();

    const note = await prisma.creditNote.create({
      data: {
        companyId,
        noteNo,
        noteDate: date,
        originalInvoiceNo: data.originalInvoiceNo || null,
        originalInvoiceDate: data.originalInvoiceDate ? new Date(data.originalInvoiceDate) : null,
        customerId: data.customerId || null,
        customerName: data.customerName,
        customerGstin: data.customerGstin || null,
        customerState: data.customerState || null,
        customerStateCode: data.customerStateCode || null,
        supplyType: data.supplyType,
        reason: data.reason || "Sales Return",
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
        data: { nextCreditNoteNo: nextNo + 1 },
      });
    }

    await postCreditNoteToAccounting({
      companyId,
      creditNoteId: note.id,
      noteNo: note.noteNo,
      customerName: note.customerName,
      taxableValue: note.taxableValue,
      cgstAmount: note.cgstAmount,
      sgstAmount: note.sgstAmount,
      igstAmount: note.igstAmount,
      totalAmount: note.totalAmount,
      date: note.noteDate,
      items: data.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
    });

    revalidatePath("/vouchers/credit-note");
    revalidatePath("/registers/credit-notes");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");
    revalidatePath("/reports/gst-summary");

    return { success: true, data: note };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create credit note" };
  }
};
