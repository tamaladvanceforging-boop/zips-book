"use server";

import prisma from "@/lib/dbClient/dbClient";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface VendorInput {
  id?: string;
  code: string;
  name: string;
  address: string;
  state: string;
  stateCode: string;
  gstin?: string;
  phone?: string;
  email?: string;
  pan?: string;
  tdsApplicable?: boolean;
  tdsSection?: string;
  tdsRate?: number;
  openingBalance?: number;
}

export const getVendors = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
      include: {
        purchaseBills: {
          select: { totalAmount: true, paidAmount: true },
        },
        payments: {
          select: { amount: true },
        },
      },
    });

    const enriched = vendors.map((v) => {
      const totalPurchased = v.purchaseBills.reduce((acc, b) => acc + b.totalAmount, 0);
      const totalPaid = v.payments.reduce((acc, p) => acc + p.amount, 0);
      const balance = v.openingBalance + totalPurchased - totalPaid;
      return {
        ...v,
        totalPurchased,
        totalPaid,
        outstandingBalance: balance,
      };
    });

    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch vendors" };
  }
};

export const createVendor = async (data: VendorInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const vendor = await prisma.vendor.create({
      data: {
        companyId,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        address: data.address.trim(),
        state: data.state.trim(),
        stateCode: data.stateCode.trim(),
        gstin: data.gstin?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        pan: data.pan?.trim() || null,
        tdsApplicable: !!data.tdsApplicable,
        tdsSection: data.tdsSection || null,
        tdsRate: Number(data.tdsRate) || 0,
        openingBalance: Number(data.openingBalance) || 0,
      },
    });
    revalidatePath("/masters/vendors");
    revalidatePath("/dashboard");
    return { success: true, data: vendor };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create vendor" };
  }
};

export const updateVendor = async (id: string, data: VendorInput) => {
  try {
    const vendor = await prisma.vendor.update({
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
        pan: data.pan?.trim() || null,
        tdsApplicable: !!data.tdsApplicable,
        tdsSection: data.tdsSection || null,
        tdsRate: Number(data.tdsRate) || 0,
        openingBalance: Number(data.openingBalance) || 0,
      },
    });
    revalidatePath("/masters/vendors");
    return { success: true, data: vendor };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update vendor" };
  }
};

export const deleteVendor = async (id: string) => {
  try {
    await prisma.vendor.delete({ where: { id } });
    revalidatePath("/masters/vendors");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete vendor" };
  }
};
