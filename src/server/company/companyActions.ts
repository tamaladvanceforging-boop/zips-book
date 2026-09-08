"use server";

import prisma from "@/lib/dbClient/dbClient";
import { getActiveCompanyId, setActiveCompanyId, clearActiveCompanyId, seedStandardChartOfAccounts } from "@/lib/companyContext";
import { getCurrentUser } from "@/lib/auth";

export interface CompanyData {
  id?: string;
  name: string;
  mailingName?: string;
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
  bankBranch?: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  purchasePrefix: string;
  nextPurchaseNo: number;
  paymentPrefix: string;
  nextPaymentNo: number;
  receiptPrefix: string;
  nextReceiptNo: number;
}

export const getCompaniesAction = async () => {
  try {
    const activeCompanyId = await getActiveCompanyId();
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            invoices: true,
            purchaseBills: true,
            items: true,
            customers: true,
            vendors: true,
          },
        },
      },
    });

    return { companies, activeCompanyId };
  } catch (error: any) {
    console.error("Failed to get companies:", error);
    return { companies: [], activeCompanyId: null };
  }
};

export const getActiveCompanyAction = async () => {
  try {
    const activeCompanyId = await getActiveCompanyId();
    if (!activeCompanyId) return { company: null };

    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId },
      include: {
        _count: {
          select: {
            invoices: true,
            purchaseBills: true,
            items: true,
            customers: true,
            vendors: true,
          },
        },
      },
    });

    return { company };
  } catch (error: any) {
    console.error("Failed to get active company:", error);
    return { company: null };
  }
};

export const getCompanyProfile = async () => {
  try {
    const res = await getActiveCompanyAction();
    if (!res.company) {
      return { success: false, error: "No active company found" };
    }
    return { success: true, data: res.company };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to get company profile" };
  }
};

export const createCompanyAction = async (data: {
  name: string;
  mailingName?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  pincode?: string;
  country?: string;
  currencySymbol?: string;
  currencyName?: string;
  financialYearFrom?: string | Date;
  booksBeginningFrom?: string | Date;
  gstin?: string;
  pan?: string;
  email?: string;
  phone?: string;
  bankName?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  bankBranch?: string;
  invoicePrefix?: string;
  purchasePrefix?: string;
  paymentPrefix?: string;
  receiptPrefix?: string;
}) => {
  try {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: "Company Name is required" };
    }

    const company = await prisma.company.create({
      data: {
        name: data.name.trim(),
        mailingName: data.mailingName?.trim() || data.name.trim(),
        addressLine1: data.addressLine1?.trim() || "123 Business Park",
        addressLine2: data.addressLine2?.trim() || "",
        city: data.city?.trim() || "Kolkata",
        state: data.state?.trim() || "West Bengal",
        stateCode: data.stateCode?.trim() || "19",
        pincode: data.pincode?.trim() || "700001",
        country: data.country?.trim() || "India",
        currencySymbol: data.currencySymbol?.trim() || "₹",
        currencyName: data.currencyName?.trim() || "INR",
        financialYearFrom: data.financialYearFrom ? new Date(data.financialYearFrom) : new Date("2025-04-01"),
        booksBeginningFrom: data.booksBeginningFrom ? new Date(data.booksBeginningFrom) : new Date("2025-04-01"),
        gstin: data.gstin?.toUpperCase().trim() || "19AAAAA0000A1Z5",
        pan: data.pan?.toUpperCase().trim() || "AAAAA0000A",
        email: data.email?.trim() || "info@company.com",
        phone: data.phone?.trim() || "9800000000",
        bankName: data.bankName?.trim() || "State Bank of India",
        bankAccountNo: data.bankAccountNo?.trim() || "00000000000",
        ifscCode: data.ifscCode?.toUpperCase().trim() || "SBIN0000000",
        bankBranch: data.bankBranch?.trim() || "Main Branch",
        invoicePrefix: data.invoicePrefix?.trim() || "INV-",
        purchasePrefix: data.purchasePrefix?.trim() || "PUR-",
        paymentPrefix: data.paymentPrefix?.trim() || "PMT-",
        receiptPrefix: data.receiptPrefix?.trim() || "RCT-",
      },
    });

    const user = await getCurrentUser();
    if (user) {
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          role: "ADMIN",
        },
      });
    }

    await seedStandardChartOfAccounts(company.id);
    await setActiveCompanyId(company.id);

    return { success: true, company };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create company" };
  }
};

export const updateCompanyAction = async (companyId: string, data: Partial<any>) => {
  try {
    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: data.name,
        mailingName: data.mailingName,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
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
        bankBranch: data.bankBranch,
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNo: data.nextInvoiceNo !== undefined ? Number(data.nextInvoiceNo) : undefined,
        purchasePrefix: data.purchasePrefix,
        nextPurchaseNo: data.nextPurchaseNo !== undefined ? Number(data.nextPurchaseNo) : undefined,
        paymentPrefix: data.paymentPrefix,
        nextPaymentNo: data.nextPaymentNo !== undefined ? Number(data.nextPaymentNo) : undefined,
        receiptPrefix: data.receiptPrefix,
        nextReceiptNo: data.nextReceiptNo !== undefined ? Number(data.nextReceiptNo) : undefined,
      },
    });

    return { success: true, company: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update company" };
  }
};

export const updateCompanyProfile = async (data: Partial<CompanyData>) => {
  try {
    const activeCompanyId = await getActiveCompanyId();
    if (!activeCompanyId) {
      return { success: false, error: "No active company selected" };
    }
    return await updateCompanyAction(activeCompanyId, data);
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update profile" };
  }
};

export const switchCompanyAction = async (companyId: string) => {
  try {
    const exists = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!exists) {
      return { success: false, error: "Company not found" };
    }

    await setActiveCompanyId(companyId);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to switch company" };
  }
};

export const shutCompanyAction = async () => {
  try {
    await clearActiveCompanyId();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to shut company" };
  }
};
