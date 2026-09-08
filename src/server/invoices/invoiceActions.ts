"use server";

import prisma from "@/lib/dbClient/dbClient";
import { postSalesInvoiceToAccounting } from "@/lib/accountingEngine";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface InvoiceItemInput {
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

export interface CreateInvoiceInput {
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerGstin?: string;
  customerState?: string;
  customerStateCode?: string;
  supplyType: string;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff?: number;
  totalAmount: number;
  notes?: string;
  items: InvoiceItemInput[];
}

export const getInvoices = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const invoices = await prisma.invoice.findMany({
      where: { companyId },
      orderBy: { invoiceDate: "desc" },
      include: {
        items: true,
        customer: true,
        receipts: true,
      },
    });
    return { success: true, data: invoices };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch invoices" };
  }
};

export const getInvoiceById = async (id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
        receipts: true,
      },
    });
    if (!invoice) return { success: false, error: "Invoice not found" };
    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch invoice" };
  }
};

export const createInvoice = async (data: CreateInvoiceInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const prefix = company?.invoicePrefix || "INV-";
    const nextNo = company?.nextInvoiceNo || 1;

    const invoiceNo = data.invoiceNo || `${prefix}${String(nextNo).padStart(5, "0")}`;
    const date = data.invoiceDate ? new Date(data.invoiceDate) : new Date();

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        invoiceNo,
        invoiceDate: date,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        customerId: data.customerId || null,
        customerName: data.customerName,
        customerAddress: data.customerAddress || null,
        customerGstin: data.customerGstin || null,
        customerState: data.customerState || null,
        customerStateCode: data.customerStateCode || null,
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

    // Update Company nextInvoiceNo counter
    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: { nextInvoiceNo: nextNo + 1 },
      });
    }

    // Post Double Entry Journal & decrease inventory
    await postSalesInvoiceToAccounting({
      companyId,
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customerName,
      taxableValue: invoice.taxableValue,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      totalAmount: invoice.totalAmount,
      date: invoice.invoiceDate,
      items: data.items.map((i) => ({ itemId: i.itemId, qty: i.qty })),
    });

    revalidatePath("/registers/sales");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");
    revalidatePath("/reports/outstanding");
    revalidatePath("/reports/gst-summary");

    return { success: true, data: invoice };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create invoice" };
  }
};

export const deleteInvoice = async (id: string) => {
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!inv) return { success: false, error: "Invoice not found" };

    // Restore stock
    for (const itm of inv.items) {
      if (itm.itemId) {
        await prisma.item.update({
          where: { id: itm.itemId },
          data: { stockQty: { increment: itm.qty } },
        });
      }
    }

    // Delete corresponding journal entries
    await prisma.journalEntry.deleteMany({
      where: { referenceId: id },
    });

    await prisma.invoice.delete({ where: { id } });

    revalidatePath("/registers/sales");
    revalidatePath("/registers/daybook");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete invoice" };
  }
};
