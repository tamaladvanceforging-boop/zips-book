"use server";

import prisma from "@/lib/dbClient/prisma";

export async function getDashboardStats() {
  try {
    const company = await prisma.companyProfile.findFirst();
    const invoices = await prisma.invoice.findMany();
    const purchases = await prisma.purchaseBill.findMany();
    const itemsCount = await prisma.item.count();
    const customersCount = await prisma.customer.count();
    const vendorsCount = await prisma.vendor.count();

    const totalInvoices = invoices.length;
    const totalTaxable = invoices.reduce((acc, inv) => acc + inv.taxableValue, 0);
    const totalCgst = invoices.reduce((acc, inv) => acc + inv.cgstAmount, 0);
    const totalSgst = invoices.reduce((acc, inv) => acc + inv.sgstAmount, 0);
    const totalIgst = invoices.reduce((acc, inv) => acc + inv.igstAmount, 0);
    const totalGstPayable = totalCgst + totalSgst + totalIgst;
    const totalInvoiceValue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

    const totalPurchaseValue = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const totalPurchaseTaxable = purchases.reduce((acc, p) => acc + p.taxableValue, 0);

    // Outstanding Receivables & Payables
    const customers = await prisma.customer.findMany({
      include: {
        invoices: { select: { totalAmount: true } },
        receipts: { select: { amount: true } },
      },
    });
    const totalReceivable = customers.reduce((sum, c) => {
      const invSum = c.invoices.reduce((a, b) => a + b.totalAmount, 0);
      const recSum = c.receipts.reduce((a, b) => a + b.amount, 0);
      return sum + (c.openingBalance + invSum - recSum);
    }, 0);

    const vendors = await prisma.vendor.findMany({
      include: {
        purchaseBills: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
      },
    });
    const totalPayable = vendors.reduce((sum, v) => {
      const purSum = v.purchaseBills.reduce((a, b) => a + b.totalAmount, 0);
      const paySum = v.payments.reduce((a, b) => a + b.amount, 0);
      return sum + (v.openingBalance + purSum - paySum);
    }, 0);

    // Bank & Cash Balances from Accounts
    const bankAcc = await prisma.account.findUnique({
      where: { code: "1020" },
      include: { journalLines: true },
    });
    const cashAcc = await prisma.account.findUnique({
      where: { code: "1010" },
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

    // Net profit = Sales Taxable - Purchase Taxable
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
}

export async function getDayBook(startDate?: string, endDate?: string, voucherType?: string) {
  try {
    const whereClause: any = {};
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
}

export async function getOutstanding() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        invoices: { select: { totalAmount: true } },
        receipts: { select: { amount: true } },
      },
      orderBy: { code: "asc" },
    });

    const receivables = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((a, b) => a + b.totalAmount, 0);
      const totalReceived = c.receipts.reduce((a, b) => a + b.amount, 0);
      const outstanding = c.openingBalance + totalInvoiced - totalReceived;
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        phone: c.phone,
        totalInvoiced,
        totalReceived,
        outstanding,
      };
    });

    const vendors = await prisma.vendor.findMany({
      include: {
        purchaseBills: { select: { totalAmount: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { code: "asc" },
    });

    const payables = vendors.map((v) => {
      const totalPurchased = v.purchaseBills.reduce((a, b) => a + b.totalAmount, 0);
      const totalPaid = v.payments.reduce((a, b) => a + b.amount, 0);
      const outstanding = v.openingBalance + totalPurchased - totalPaid;
      return {
        id: v.id,
        code: v.code,
        name: v.name,
        phone: v.phone,
        totalPurchased,
        totalPaid,
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
}

export async function getGstSummary() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { status: { not: "CANCELLED" } },
    });
    const purchases = await prisma.purchaseBill.findMany({
      where: { status: { not: "CANCELLED" } },
    });

    // Outward Supplies (Sales)
    const outwardTaxable = invoices.reduce((sum, inv) => sum + inv.taxableValue, 0);
    const outwardCgst = invoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
    const outwardSgst = invoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
    const outwardIgst = invoices.reduce((sum, inv) => sum + inv.igstAmount, 0);
    const totalGstPayable = outwardCgst + outwardSgst + outwardIgst;
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Intra vs Inter supply breakup
    const intraSales = invoices.filter((i) => i.supplyType.includes("Intra"));
    const interSales = invoices.filter((i) => i.supplyType.includes("Inter"));

    const intraBreakup = {
      taxable: intraSales.reduce((sum, i) => sum + i.taxableValue, 0),
      cgst: intraSales.reduce((sum, i) => sum + i.cgstAmount, 0),
      sgst: intraSales.reduce((sum, i) => sum + i.sgstAmount, 0),
      igst: 0,
    };

    const interBreakup = {
      taxable: interSales.reduce((sum, i) => sum + i.taxableValue, 0),
      cgst: 0,
      sgst: 0,
      igst: interSales.reduce((sum, i) => sum + i.igstAmount, 0),
    };

    // Inward Supplies (Purchases / Input Tax Credit)
    const inwardTaxable = purchases.reduce((sum, p) => sum + p.taxableValue, 0);
    const itmCgst = purchases.reduce((sum, p) => sum + p.cgstAmount, 0);
    const itmSgst = purchases.reduce((sum, p) => sum + p.sgstAmount, 0);
    const itmIgst = purchases.reduce((sum, p) => sum + p.igstAmount, 0);
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
}

export async function getTrialBalance() {
  try {
    const accounts = await prisma.account.findMany({
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
}

export async function getProfitLoss() {
  try {
    // Income: Sales Account (4010)
    const salesAcc = await prisma.account.findUnique({
      where: { code: "4010" },
      include: { journalLines: true },
    });
    const salesIncome = salesAcc
      ? salesAcc.openingCr +
        salesAcc.journalLines.reduce((s, l) => s + l.credit - l.debit, 0)
      : 0;

    // COGS: Purchase Account (5010)
    const purAcc = await prisma.account.findUnique({
      where: { code: "5010" },
      include: { journalLines: true },
    });
    const purchaseCost = purAcc
      ? purAcc.openingDr +
        purAcc.journalLines.reduce((s, l) => s + l.debit - l.credit, 0)
      : 0;

    const grossProfit = salesIncome - purchaseCost;

    // Indirect Expenses: 5020 (Salary), 5030 (Rent), 5040 (Other Expenses)
    const expAccounts = await prisma.account.findMany({
      where: {
        type: "Expense",
        code: { not: "5010" },
      },
      include: { journalLines: true },
    });

    const expenses = expAccounts.map((acc) => {
      const amount =
        acc.openingDr +
        acc.journalLines.reduce((s, l) => s + l.debit - l.credit, 0);
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
}

export async function getBalanceSheet() {
  try {
    const plRes = await getProfitLoss();
    const netProfit = plRes.success && plRes.data ? plRes.data.netProfit : 0;

    // Assets: Cash (1010), Bank (1020), Debtors (1030), GST ITC (1040), Stock (1070), TDS Rec (1080)
    const assetAccounts = await prisma.account.findMany({
      where: { type: "Asset" },
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

    // Liabilities: Creditors (2010), GST Payable (2020), TDS Payable (2030)
    const liabilityAccounts = await prisma.account.findMany({
      where: { type: "Liability" },
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

    // Equity: Capital Account (3010) + Current Period Net Profit
    const capitalAcc = await prisma.account.findUnique({
      where: { code: "3010" },
      include: { journalLines: true },
    });
    const capitalAmount = capitalAcc
      ? capitalAcc.openingCr +
        capitalAcc.journalLines.reduce((s, l) => s + l.credit - l.debit, 0)
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
}
