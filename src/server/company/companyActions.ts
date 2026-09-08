"use server";

import prisma from "@/lib/dbClient/prisma";
import { revalidatePath } from "next/cache";

export interface CompanyData {
  id?: string;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccountNo: string;
  ifscCode: string;
  invoicePrefix?: string;
  nextInvoiceNo?: number;
  purchasePrefix?: string;
  nextPurchaseNo?: number;
  paymentPrefix?: string;
  nextPaymentNo?: number;
  receiptPrefix?: string;
  nextReceiptNo?: number;
}

export async function getCompanyProfile() {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          name: "Your Company Pvt Ltd",
          addressLine1: "123 Business Park",
          addressLine2: "Sector 5",
          city: "Kolkata",
          state: "West Bengal",
          stateCode: "19",
          pincode: "700001",
          gstin: "19AAAAA0000A1Z5",
          pan: "AAAAA0000A",
          email: "info@yourcompany.com",
          phone: "9800000000",
          bankName: "State Bank of India",
          bankAccountNo: "00000000000",
          ifscCode: "SBIN0000000",
        },
      });
    }
    return { success: true, data: profile };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch company profile" };
  }
}

export async function updateCompanyProfile(data: CompanyData) {
  try {
    const existing = await prisma.companyProfile.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.companyProfile.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || "",
          city: data.city,
          state: data.state,
          stateCode: data.stateCode,
          pincode: data.pincode,
          gstin: data.gstin,
          pan: data.pan,
          email: data.email,
          phone: data.phone,
          bankName: data.bankName,
          bankAccountNo: data.bankAccountNo,
          ifscCode: data.ifscCode,
          invoicePrefix: data.invoicePrefix ?? existing.invoicePrefix,
          nextInvoiceNo: data.nextInvoiceNo ?? existing.nextInvoiceNo,
          purchasePrefix: data.purchasePrefix ?? existing.purchasePrefix,
          nextPurchaseNo: data.nextPurchaseNo ?? existing.nextPurchaseNo,
          paymentPrefix: data.paymentPrefix ?? existing.paymentPrefix,
          nextPaymentNo: data.nextPaymentNo ?? existing.nextPaymentNo,
          receiptPrefix: data.receiptPrefix ?? existing.receiptPrefix,
          nextReceiptNo: data.nextReceiptNo ?? existing.nextReceiptNo,
        },
      });
    } else {
      updated = await prisma.companyProfile.create({
        data: {
          name: data.name,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || "",
          city: data.city,
          state: data.state,
          stateCode: data.stateCode,
          pincode: data.pincode,
          gstin: data.gstin,
          pan: data.pan,
          email: data.email,
          phone: data.phone,
          bankName: data.bankName,
          bankAccountNo: data.bankAccountNo,
          ifscCode: data.ifscCode,
        },
      });
    }
    revalidatePath("/company");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update company profile" };
  }
}
