"use server";

import prisma from "@/lib/dbClient/dbClient";
import { revalidatePath } from "next/cache";
import { getActiveCompanyId } from "@/lib/companyContext";

export interface ItemInput {
  id?: string;
  code: string;
  name: string;
  hsnSac: string;
  unit: string;
  rate: number;
  gstRate: number;
  stockQty?: number;
}

export const getItems = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const items = await prisma.item.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch items" };
  }
};

export const createItem = async (data: ItemInput) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: false, error: "No active company selected" };

    const item = await prisma.item.create({
      data: {
        companyId,
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        hsnSac: data.hsnSac.trim(),
        unit: data.unit || "PCS",
        rate: Number(data.rate) || 0,
        gstRate: Number(data.gstRate) || 0,
        stockQty: Number(data.stockQty) || 0,
      },
    });
    revalidatePath("/masters/items");
    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create item" };
  }
};

export const updateItem = async (id: string, data: ItemInput) => {
  try {
    const item = await prisma.item.update({
      where: { id },
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        hsnSac: data.hsnSac.trim(),
        unit: data.unit || "PCS",
        rate: Number(data.rate) || 0,
        gstRate: Number(data.gstRate) || 0,
        stockQty: Number(data.stockQty) || 0,
      },
    });
    revalidatePath("/masters/items");
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update item" };
  }
};

export const deleteItem = async (id: string) => {
  try {
    await prisma.item.delete({ where: { id } });
    revalidatePath("/masters/items");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete item" };
  }
};
