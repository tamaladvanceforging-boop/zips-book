"use server";

import prisma from "@/lib/dbClient/prisma";
import { revalidatePath } from "next/cache";

export interface CustomerInput {
  id?: string;
  code: string;
  name: string;
  address: string;
  state: string;
  stateCode: string;
  gstin?: string;
  phone?: string;
  email?: string;
  openingBalance?: number;
}

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { code: "asc" },
      include: {
        invoices: {
          select: { totalAmount: true, paidAmount: true },
        },
        receipts: {
          select: { amount: true },
        },
      },
    });

    const enriched = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
      const totalReceived = c.receipts.reduce((acc, r) => acc + r.amount, 0);
      const balance = c.openingBalance + totalInvoiced - totalReceived;
      return {
        ...c,
        totalInvoiced,
        totalReceived,
        outstandingBalance: balance,
      };
    });

    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch customers" };
  }
}

export async function createCustomer(data: CustomerInput) {
  try {
    const customer = await prisma.customer.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        address: data.address.trim(),
        state: data.state.trim(),
        stateCode: data.stateCode.trim(),
        gstin: data.gstin?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        openingBalance: Number(data.openingBalance) || 0,
      },
    });
    revalidatePath("/masters/customers");
    revalidatePath("/dashboard");
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create customer" };
  }
}

export async function updateCustomer(id: string, data: CustomerInput) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        address: data.address.trim(),
        state: data.state.trim(),
        stateCode: data.stateCode.trim(),
        gstin: data.gstin?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        openingBalance: Number(data.openingBalance) || 0,
      },
    });
    revalidatePath("/masters/customers");
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update customer" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/masters/customers");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete customer" };
  }
}
