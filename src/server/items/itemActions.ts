"use server";

import prisma from "@/lib/dbClient/prisma";
import { revalidatePath } from "next/cache";

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

export async function getItems() {
  try {
    const items = await prisma.item.findMany({
      orderBy: { code: "asc" },
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch items" };
  }
}

export async function createItem(data: ItemInput) {
  try {
    const item = await prisma.item.create({
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
    revalidatePath("/dashboard");
    return { success: true, data: item };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create item" };
  }
}

export async function updateItem(id: string, data: ItemInput) {
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
}

export async function deleteItem(id: string) {
  try {
    await prisma.item.delete({ where: { id } });
    revalidatePath("/masters/items");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete item" };
  }
}
