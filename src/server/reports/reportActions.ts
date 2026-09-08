"use server";

import prisma from "@/lib/dbClient/dbClient";
import { getActiveCompanyId } from "@/lib/companyContext";

export const getDashboardStats = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) {
      return {
        success: true,
        data: {
          company: null,
          totalInvoices: 0,
          totalTaxable: 0,
          totalCgst: 0,
          totalSgst: 0,
          totalIgst: 0,
          totalGstPayable: 0,
          totalInvoiceValue: 0,
          totalPurchaseValue: 0,
          totalReceivable: 0,
          totalPayable: 0,
          bankBalance: 0,
          cashBalance: 0,
          itemsCount: 0,
          customersCount: 0,
          vendorsCount: 0,
          netProfit: 0,
        },
      };
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const invoices = await prisma.invoice.findMany({ where: { companyId } });
    const purchases = await prisma.purchaseBill.findMany({ where: { companyId } });
    const creditNotes = await prisma.creditNote.findMany({ where: { companyId, status: { not: "CANCELLED" } } });
    const debitNotes = await prisma.debitNote.findMany({ where: { companyId, status: { not: "CANCELLED" } } });
    const itemsCount = await prisma.item.count({ where: { companyId } });
    const customersCount = await prisma.customer.count({ where: { companyId } });
    const vendorsCount = await prisma.vendor.count({ where: { companyId } });

    const totalInvoices = invoices.length;
    const rawTaxable = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
    const rawCgst = invoices.reduce((acc, inv) => acc + inv.cgstAmount, 0);
    const rawSgst = invoices.reduce((acc, inv) => acc + inv.sgstAmount, 0);
    const rawIgst = invoices.reduce((acc, inv) => acc + inv.igstAmount, 0);

    const cnTaxable = creditNotes.reduce((acc, c) => acc + c.taxableValue, 0);
    const cnCgst = creditNotes.reduce((acc, c) => acc + c.cgstAmount, 0);
    const cnSgst = creditNotes.reduce((acc, c) => acc + c.sgstAmount, 0);
    const cnIgst = creditNotes.reduce((acc, c) => acc + c.igstAmount, 0);
    const cnTotalAmount = creditNotes.reduce((acc, c) => acc + c.totalAmount, 0);

    const dnTaxable = debitNotes.reduce((acc, d) => acc + d.taxableValue, 0);
    const dnTotalAmount = debitNotes.reduce((acc, d) => acc + d.totalAmount, 0);

    const totalTaxable = Math.max(0, rawTaxable - cnTaxable);
    const totalCgst = Math.max(0, rawCgst - cnCgst);
    const totalSgst = Math.max(0, rawSgst - cnSgst);
    const totalIgst = Math.max(0, rawIgst - cnIgst);
    const totalGstPayable = totalCgst + totalSgst + totalIgst;
    const totalInvoiceValue = Math.max(0, invoices.reduce((acc, inv) => acc + inv.totalAmount, 0) - cnTotalAmount);

    const totalPurchaseValue = Math.max(0, purchases.reduce((acc, p) => acc + p.totalAmount, 0) - dnTotalAmount);
    const totalPurchaseTaxable = Math.max(0, purchases.reduce((acc, p) => acc + p.taxableValue, 0) - dnTaxable);

    // Outstanding Receivables & Payables
    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: {
        invoices: { select: { totalAmount: true } },
        receipts: { select: { amount: true } },
        creditNotes: { select: { totalAmount: true } },
      },
    });
    const totalReceivable = customers.reduce((sum, c) => {
      const invSum = c.invoices.reduce((a, b) => a + b.totalAmount, 0);
      const recSum = c.receipts.reduce((a, b) => a + b.amount, 0);
      const cnSum = c.creditNotes.reduce((a, b) => a + b.totalAmount, 0);
      return sum + (c.openingBalance + invSum - recSum - cnSum);
    }, 0);

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      include: {
        purchaseBills: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
        debitNotes: { select: { totalAmount: true } },
      },
    });
    const totalPayable = vendors.reduce((sum, v) => {
      const purSum = v.purchaseBills.reduce((a, b) => a + b.totalAmount, 0);
      const paySum = v.payments.reduce((a, b) => a + b.amount, 0);
      const dnSum = v.debitNotes.reduce((a, b) => a + b.totalAmount, 0);
      return sum + (v.openingBalance + purSum - paySum - dnSum);
    }, 0);

    // Bank & Cash Balances from Accounts
    const bankAcc = await prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ code: "1020" }, { code: "BANK-01" }, { category: "Bank Accounts" }],
      },
      include: { journalLines: true },
    });
    const cashAcc = await prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ code: "1010" }, { code: "CASH-01" }, { name: { contains: "Cash" } }],
      },
      include: { journalLines: true },
    });

    const calcClosing = (acc: any) => {
      if (!acc) return 0;
      const dr = acc.openingDr + acc.journalLines.reduce((s: number, l: any) => s + l.debit, 0);
      const cr = acc.openingCr + acc.journalLines.reduce((s: number, l: any) => s + l.credit, 0);
      return dr - cr;
    };

    const bankBalance = calcClosing(bankAcc);
    const cashBalance = calcClosing(cashAcc);

    const grossProfit = totalTaxable - totalPurchaseTaxable;
    const netProfit = grossProfit;

    return {
      success: true,
      data: {
        company,
        totalInvoices,
        totalTaxable,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGstPayable,
        totalInvoiceValue,
        totalPurchaseValue,
        totalReceivable: Math.max(0, totalReceivable),
        totalPayable: Math.max(0, totalPayable),
        bankBalance,
        cashBalance,
        itemsCount,
        customersCount,
        vendorsCount,
        netProfit,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch dashboard stats" };
  }
};

export const getDayBook = async (startDate?: string, endDate?: string, voucherType?: string) => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: [] };

    const whereClause: any = { companyId };
    if (startDate || endDate) {
      whereClause.entryDate = {};
      if (startDate) whereClause.entryDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.entryDate.lte = end;
      }
    }
    if (voucherType && voucherType !== "ALL") {
      whereClause.voucherType = voucherType;
    }

    const entries = await prisma.journalEntry.findMany({
      where: whereClause,
      orderBy: { entryDate: "desc" },
      include: {
        lines: true,
      },
    });

    return { success: true, data: entries };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch Day Book" };
  }
};

export const getOutstanding = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: { receivables: [], payables: [], totalReceivable: 0, totalPayable: 0 } };

    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: {
        invoices: { select: { totalAmount: true } },
        receipts: { select: { amount: true } },
        creditNotes: { select: { totalAmount: true } },
      },
      orderBy: { code: "asc" },
    });

    const receivables = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((a, b) => a + b.totalAmount, 0);
      const totalReceived = c.receipts.reduce((a, b) => a + b.amount, 0);
      const totalCreditNotes = c.creditNotes.reduce((a, b) => a + b.totalAmount, 0);
      const outstanding = c.openingBalance + totalInvoiced - totalReceived - totalCreditNotes;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        totalInvoiced,
        totalReceived,
        totalCreditNotes,
        outstanding,
      };
    });

    const vendors = await prisma.vendor.findMany({
      where: { companyId },
      include: {
        purchaseBills: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
        debitNotes: { select: { totalAmount: true } },
      },
      orderBy: { code: "asc" },
    });

    const payables = vendors.map((v) => {
      const totalPurchased = v.purchaseBills.reduce((a, b) => a + b.totalAmount, 0);
      const totalPaid = v.payments.reduce((a, b) => a + b.amount, 0);
      const totalDebitNotes = v.debitNotes.reduce((a, b) => a + b.totalAmount, 0);
      const outstanding = v.openingBalance + totalPurchased - totalPaid - totalDebitNotes;
      return {
        id: v.id,
        code: v.code,
        name: v.name,
        phone: v.phone,
        totalPurchased,
        totalPaid,
        totalDebitNotes,
        outstanding,
      };
    });

    const totalReceivable = receivables.reduce((sum, r) => sum + r.outstanding, 0);
    const totalPayable = payables.reduce((sum, p) => sum + p.outstanding, 0);

    return {
      success: true,
      data: {
        receivables,
        payables,
        totalReceivable,
        totalPayable,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch outstanding" };
  }
};

export const getGstSummary = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) {
      return {
        success: true,
        data: {
          outward: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalGstPayable: 0, totalInvoiceValue: 0, count: 0, intraBreakup: { taxable: 0, cgst: 0, sgst: 0, igst: 0 }, interBreakup: { taxable: 0, cgst: 0, sgst: 0, igst: 0 } },
          inward: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalItc: 0, count: 0 },
          netTax: { totalOutput: 0, totalInput: 0, netPayable: 0, itcCarriedForward: 0 },
        },
      };
    }

    const invoices = await prisma.invoice.findMany({
      where: { companyId, status: { not: "CANCELLED" } },
    });
    const purchases = await prisma.purchaseBill.findMany({
      where: { companyId, status: { not: "CANCELLED" } },
    });
    const creditNotes = await prisma.creditNote.findMany({
      where: { companyId, status: { not: "CANCELLED" } },
    });
    const debitNotes = await prisma.debitNote.findMany({
      where: { companyId, status: { not: "CANCELLED" } },
    });

    // Credit notes adjustments
    const cnTaxable = creditNotes.reduce((sum, c) => sum + c.taxableValue, 0);
    const cnCgst = creditNotes.reduce((sum, c) => sum + c.cgstAmount, 0);
    const cnSgst = creditNotes.reduce((sum, c) => sum + c.sgstAmount, 0);
    const cnIgst = creditNotes.reduce((sum, c) => sum + c.igstAmount, 0);
    const cnTotalAmount = creditNotes.reduce((sum, c) => sum + c.totalAmount, 0);

    // Debit notes adjustments (ITC Reversal)
    const dnTaxable = debitNotes.reduce((sum, d) => sum + d.taxableValue, 0);
    const dnCgst = debitNotes.reduce((sum, d) => sum + d.cgstAmount, 0);
    const dnSgst = debitNotes.reduce((sum, d) => sum + d.sgstAmount, 0);
    const dnIgst = debitNotes.reduce((sum, d) => sum + d.igstAmount, 0);

    // Outward Supplies (Sales net of Credit Notes)
    const rawOutwardTaxable = invoices.reduce((sum, inv) => sum + inv.taxableValue, 0);
    const rawOutwardCgst = invoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
    const rawOutwardSgst = invoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
    const rawOutwardIgst = invoices.reduce((sum, inv) => sum + inv.igstAmount, 0);

    const outwardTaxable = Math.max(0, rawOutwardTaxable - cnTaxable);
    const outwardCgst = Math.max(0, rawOutwardCgst - cnCgst);
    const outwardSgst = Math.max(0, rawOutwardSgst - cnSgst);
    const outwardIgst = Math.max(0, rawOutwardIgst - cnIgst);
    const totalGstPayable = outwardCgst + outwardSgst + outwardIgst;
    const totalInvoiceValue = Math.max(0, invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) - cnTotalAmount);

    const intraSales = invoices.filter((i) => i.supplyType.includes("Intra"));
    const interSales = invoices.filter((i) => i.supplyType.includes("Inter"));

    const intraBreakup = {
      taxable: Math.max(0, intraSales.reduce((sum, i) => sum + i.taxableValue, 0) - (cnCgst > 0 ? cnTaxable : 0)),
      cgst: Math.max(0, intraSales.reduce((sum, i) => sum + i.cgstAmount, 0) - cnCgst),
      sgst: Math.max(0, intraSales.reduce((sum, i) => sum + i.sgstAmount, 0) - cnSgst),
      igst: 0,
    };

    const interBreakup = {
      taxable: Math.max(0, interSales.reduce((sum, i) => sum + i.taxableValue, 0) - (cnIgst > 0 ? cnTaxable : 0)),
      cgst: 0,
      sgst: 0,
      igst: Math.max(0, interSales.reduce((sum, i) => sum + i.igstAmount, 0) - cnIgst),
    };

    // Inward Supplies (Purchases / Input Tax Credit net of Debit Notes)
    const rawInwardTaxable = purchases.reduce((sum, p) => sum + p.taxableValue, 0);
    const rawItmCgst = purchases.reduce((sum, p) => sum + p.cgstAmount, 0);
    const rawItmSgst = purchases.reduce((sum, p) => sum + p.sgstAmount, 0);
    const rawItmIgst = purchases.reduce((sum, p) => sum + p.igstAmount, 0);

    const inwardTaxable = Math.max(0, rawInwardTaxable - dnTaxable);
    const itmCgst = Math.max(0, rawItmCgst - dnCgst);
    const itmSgst = Math.max(0, rawItmSgst - dnSgst);
    const itmIgst = Math.max(0, rawItmIgst - dnIgst);
    const totalItc = itmCgst + itmSgst + itmIgst;

    // Net GST liability
    const netGstPayable = Math.max(0, totalGstPayable - totalItc);
    const itcCarriedForward = Math.max(0, totalItc - totalGstPayable);

    return {
      success: true,
      data: {
        outward: {
          taxableValue: outwardTaxable,
          cgst: outwardCgst,
          sgst: outwardSgst,
          igst: outwardIgst,
          totalGstPayable,
          totalInvoiceValue,
          count: invoices.length,
          intraBreakup,
          interBreakup,
        },
        inward: {
          taxableValue: inwardTaxable,
          cgst: itmCgst,
          sgst: itmSgst,
          igst: itmIgst,
          totalItc,
          count: purchases.length,
        },
        netTax: {
          totalOutput: totalGstPayable,
          totalInput: totalItc,
          netPayable: netGstPayable,
          itcCarriedForward,
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch GST summary" };
  }
};

export const getTrialBalance = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) return { success: true, data: { rows: [], totals: { openingDr: 0, openingCr: 0, periodDr: 0, periodCr: 0, closingDr: 0, closingCr: 0, isBalanced: true, difference: 0 } } };

    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { code: "asc" },
      include: {
        journalLines: true,
      },
    });

    let totalOpeningDr = 0;
    let totalOpeningCr = 0;
    let totalPeriodDr = 0;
    let totalPeriodCr = 0;
    let totalClosingDr = 0;
    let totalClosingCr = 0;

    const rows = accounts.map((acc) => {
      const periodDr = acc.journalLines.reduce((s, l) => s + l.debit, 0);
      const periodCr = acc.journalLines.reduce((s, l) => s + l.credit, 0);

      const netDr = acc.openingDr + periodDr;
      const netCr = acc.openingCr + periodCr;

      let closingDr = 0;
      let closingCr = 0;

      if (netDr >= netCr) {
        closingDr = netDr - netCr;
      } else {
        closingCr = netCr - netDr;
      }

      totalOpeningDr += acc.openingDr;
      totalOpeningCr += acc.openingCr;
      totalPeriodDr += periodDr;
      totalPeriodCr += periodCr;
      totalClosingDr += closingDr;
      totalClosingCr += closingCr;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        openingDr: acc.openingDr,
        openingCr: acc.openingCr,
        periodDr,
        periodCr,
        closingDr,
        closingCr,
      };
    });

    const isBalanced = Math.abs(totalClosingDr - totalClosingCr) < 0.01;

    return {
      success: true,
      data: {
        rows,
        totals: {
          openingDr: totalOpeningDr,
          openingCr: totalOpeningCr,
          periodDr: totalPeriodDr,
          periodCr: totalPeriodCr,
          closingDr: totalClosingDr,
          closingCr: totalClosingCr,
          isBalanced,
          difference: Math.abs(totalClosingDr - totalClosingCr),
        },
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch Trial Balance" };
  }
};

export const getProfitLoss = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) {
      return {
        success: true,
        data: {
          income: { sales: 0, totalIncome: 0 },
          cogs: { purchases: 0, totalCogs: 0 },
          grossProfit: 0,
          expenses: [],
          totalIndirectExpenses: 0,
          netProfit: 0,
        },
      };
    }

    // Income: Sales Account (4010 or SALES-01 or category Sales Accounts)
    const salesAcc = await prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ code: "4010" }, { code: "SALES-01" }, { category: "Sales Accounts" }],
      },
      include: { journalLines: true },
    });
    const salesIncome = salesAcc
      ? salesAcc.openingCr + salesAcc.journalLines.reduce((s, l) => s + l.credit - l.debit, 0)
      : 0;

    // COGS: Purchase Account (5010 or PURCHASE-01 or category Purchase Accounts)
    const purAcc = await prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ code: "5010" }, { code: "PURCHASE-01" }, { category: "Purchase Accounts" }],
      },
      include: { journalLines: true },
    });
    const purchaseCost = purAcc
      ? purAcc.openingDr + purAcc.journalLines.reduce((s, l) => s + l.debit - l.credit, 0)
      : 0;

    const grossProfit = salesIncome - purchaseCost;

    // Indirect Expenses
    const expAccounts = await prisma.account.findMany({
      where: {
        companyId,
        type: "Expense",
        code: { notIn: ["5010", "PURCHASE-01"] },
      },
      include: { journalLines: true },
    });

    const expenses = expAccounts.map((acc) => {
      const amount = acc.openingDr + acc.journalLines.reduce((s, l) => s + l.debit - l.credit, 0);
      return {
        code: acc.code,
        name: acc.name,
        amount: Math.max(0, amount),
      };
    });

    const totalIndirectExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = grossProfit - totalIndirectExpenses;

    return {
      success: true,
      data: {
        income: {
          sales: Math.max(0, salesIncome),
          totalIncome: Math.max(0, salesIncome),
        },
        cogs: {
          purchases: Math.max(0, purchaseCost),
          totalCogs: Math.max(0, purchaseCost),
        },
        grossProfit,
        expenses,
        totalIndirectExpenses,
        netProfit,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch Profit & Loss" };
  }
};

export const getBalanceSheet = async () => {
  try {
    const companyId = await getActiveCompanyId();
    if (!companyId) {
      return {
        success: true,
        data: {
          assets: [],
          totalAssets: 0,
          liabilities: [],
          totalLiabilities: 0,
          equity: { capitalAmount: 0, netProfit: 0, totalEquity: 0 },
          totalLiabilitiesAndEquity: 0,
          isBalanced: true,
          difference: 0,
        },
      };
    }

    const plRes = await getProfitLoss();
    const netProfit = plRes.success && plRes.data ? plRes.data.netProfit : 0;

    const assetAccounts = await prisma.account.findMany({
      where: { companyId, type: "Asset" },
      include: { journalLines: true },
      orderBy: { code: "asc" },
    });

    const assets = assetAccounts.map((acc) => {
      const dr = acc.openingDr + acc.journalLines.reduce((s, l) => s + l.debit, 0);
      const cr = acc.openingCr + acc.journalLines.reduce((s, l) => s + l.credit, 0);
      const balance = dr - cr;
      return {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        amount: balance,
      };
    });

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);

    const liabilityAccounts = await prisma.account.findMany({
      where: { companyId, type: "Liability" },
      include: { journalLines: true },
      orderBy: { code: "asc" },
    });

    const liabilities = liabilityAccounts.map((acc) => {
      const cr = acc.openingCr + acc.journalLines.reduce((s, l) => s + l.credit, 0);
      const dr = acc.openingDr + acc.journalLines.reduce((s, l) => s + l.debit, 0);
      const balance = cr - dr;
      return {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        amount: balance,
      };
    });

    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);

    const capitalAcc = await prisma.account.findFirst({
      where: {
        companyId,
        OR: [{ code: "3010" }, { code: "CAPITAL-01" }, { category: "Capital" }],
      },
      include: { journalLines: true },
    });
    const capitalAmount = capitalAcc
      ? capitalAcc.openingCr + capitalAcc.journalLines.reduce((s, l) => s + l.credit - l.debit, 0)
      : 0;

    const totalEquity = capitalAmount + netProfit;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 1;

    return {
      success: true,
      data: {
        assets,
        totalAssets,
        liabilities,
        totalLiabilities,
        equity: {
          capitalAmount,
          netProfit,
          totalEquity,
        },
        totalLiabilitiesAndEquity,
        isBalanced,
        difference: Math.abs(totalAssets - totalLiabilitiesAndEquity),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to fetch Balance Sheet" };
  }
};
