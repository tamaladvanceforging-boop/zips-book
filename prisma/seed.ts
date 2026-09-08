import prisma from "../src/lib/dbClient/prisma";

async function main() {
  console.log("Seeding ZIPS-Book database...");

  // 1. Company Profile
  await prisma.companyProfile.deleteMany();
  await prisma.companyProfile.create({
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
      invoicePrefix: "INV-",
      nextInvoiceNo: 2,
      purchasePrefix: "PUR-",
      nextPurchaseNo: 2,
      paymentPrefix: "PMT-",
      nextPaymentNo: 2,
      receiptPrefix: "RCT-",
      nextReceiptNo: 2,
    },
  });

  // 2. Chart of Accounts (COA)
  const initialAccounts = [
    { code: "1010", name: "Cash-in-Hand", type: "Asset", category: "Current Assets", openingDr: 50000, openingCr: 0, isSystem: true },
    { code: "1020", name: "Bank Account", type: "Asset", category: "Current Assets", openingDr: 200000, openingCr: 0, isSystem: true },
    { code: "1030", name: "Sundry Debtors", type: "Asset", category: "Current Assets", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "1040", name: "GST Input Credit", type: "Asset", category: "Duties & Taxes", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "1070", name: "Stock/Inventory", type: "Asset", category: "Current Assets", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "1080", name: "TDS Receivable", type: "Asset", category: "Duties & Taxes", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "2010", name: "Sundry Creditors", type: "Liability", category: "Current Liabilities", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "2020", name: "GST Payable", type: "Liability", category: "Duties & Taxes", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "2030", name: "TDS Payable", type: "Liability", category: "Duties & Taxes", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "3010", name: "Capital Account", type: "Equity", category: "Capital", openingDr: 0, openingCr: 250000, isSystem: true },
    { code: "4010", name: "Sales Account", type: "Income", category: "Sales Accounts", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "5010", name: "Purchase Account", type: "Expense", category: "Purchase Accounts", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "5020", name: "Salary Expense", type: "Expense", category: "Indirect Expenses", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "5030", name: "Rent Expense", type: "Expense", category: "Indirect Expenses", openingDr: 0, openingCr: 0, isSystem: true },
    { code: "5040", name: "Other Expenses", type: "Expense", category: "Indirect Expenses", openingDr: 0, openingCr: 0, isSystem: true },
  ];

  for (const acc of initialAccounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: acc,
      create: acc,
    });
  }

  // 3. Item Master
  const initialItems = [
    { code: "ITM001", name: "Sample Product A", hsnSac: "8471", unit: "PCS", rate: 1000, gstRate: 18, stockQty: 50 },
    { code: "ITM002", name: "Sample Service B", hsnSac: "9983", unit: "NOS", rate: 500, gstRate: 18, stockQty: 0 },
  ];

  for (const item of initialItems) {
    await prisma.item.upsert({
      where: { code: item.code },
      update: item,
      create: item,
    });
  }

  // 4. Customer Master
  const initialCustomers = [
    { code: "CUS001", name: "Rahim Traders", address: "45 Park Street, Kolkata", state: "West Bengal", stateCode: "19", gstin: "19BBBBB1111B1Z2", phone: "9811111111", email: "rahim@traders.com", openingBalance: 0 },
    { code: "CUS002", name: "Sharma Enterprises", address: "12 MG Road, Delhi", state: "Delhi", stateCode: "07", gstin: "07CCCCC2222C1Z3", phone: "9822222222", email: "sharma@ent.com", openingBalance: 0 },
  ];

  for (const cust of initialCustomers) {
    await prisma.customer.upsert({
      where: { code: cust.code },
      update: cust,
      create: cust,
    });
  }

  // 5. Vendor Master
  const initialVendors = [
    { code: "VEN001", name: "Ganguly Suppliers", address: "22 Strand Road, Kolkata", state: "West Bengal", stateCode: "19", gstin: "19DDDDD3333D1Z4", phone: "9833333333", email: "ganguly@suppliers.com", pan: "AABCG1234C", tdsApplicable: true, tdsSection: "194Q", tdsRate: 0.1, openingBalance: 0 },
    { code: "VEN002", name: "Mehta Industries", address: "8 Industrial Area, Pune", state: "Maharashtra", stateCode: "27", gstin: "27EEEEE4444E1Z6", phone: "9844444444", email: "mehta@industries.com", pan: "AABCM5678D", tdsApplicable: true, tdsSection: "194Q", tdsRate: 0.1, openingBalance: 0 },
  ];

  for (const vend of initialVendors) {
    await prisma.vendor.upsert({
      where: { code: vend.code },
      update: vend,
      create: vend,
    });
  }

  // 6. Clean existing vouchers to reseed cleanly
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseBillItem.deleteMany();
  await prisma.purchaseBill.deleteMany();
  await prisma.paymentVoucher.deleteMany();
  await prisma.receiptVoucher.deleteMany();

  const cust1 = await prisma.customer.findUnique({ where: { code: "CUS001" } });
  const vend1 = await prisma.vendor.findUnique({ where: { code: "VEN001" } });
  const itm1 = await prisma.item.findUnique({ where: { code: "ITM001" } });

  // 7. Initial Sales Invoice INV-00001
  const inv = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-00001",
      customerId: cust1?.id,
      customerName: cust1?.name || "Rahim Traders",
      customerAddress: cust1?.address,
      customerGstin: cust1?.gstin,
      customerState: cust1?.state,
      customerStateCode: cust1?.stateCode,
      supplyType: "Intra-State (CGST+SGST)",
      taxableValue: 2000,
      cgstAmount: 180,
      sgstAmount: 180,
      igstAmount: 0,
      totalAmount: 2360,
      paidAmount: 2360,
      status: "PAID",
      items: {
        create: [
          {
            itemId: itm1?.id,
            itemCode: "ITM001",
            itemName: "Sample Product A",
            hsnSac: "8471",
            unit: "PCS",
            qty: 2,
            rate: 1000,
            taxableValue: 2000,
            gstRate: 18,
            cgstAmount: 180,
            sgstAmount: 180,
            igstAmount: 0,
            totalAmount: 2360,
          },
        ],
      },
    },
  });

  // Journal for INV-00001
  await prisma.journalEntry.create({
    data: {
      voucherType: "Sales",
      voucherNo: inv.invoiceNo,
      referenceId: inv.id,
      narration: `Sales Invoice ${inv.invoiceNo}`,
      lines: {
        create: [
          { accountName: "Sundry Debtors", debit: 2360, credit: 0, narration: "To Rahim Traders" },
          { accountName: "Sales Account", debit: 0, credit: 2000, narration: "Sales Taxable" },
          { accountName: "GST Payable", debit: 0, credit: 360, narration: "Output CGST+SGST" },
        ],
      },
    },
  });

  // 8. Initial Purchase Bill PUR-00001
  const pur = await prisma.purchaseBill.create({
    data: {
      voucherNo: "PUR-00001",
      vendorBillNo: "VEN-BILL-101",
      vendorId: vend1?.id,
      vendorName: vend1?.name || "Ganguly Suppliers",
      vendorAddress: vend1?.address,
      vendorGstin: vend1?.gstin,
      vendorState: vend1?.state,
      vendorStateCode: vend1?.stateCode,
      supplyType: "Intra-State (CGST+SGST)",
      taxableValue: 5000,
      cgstAmount: 450,
      sgstAmount: 450,
      igstAmount: 0,
      totalAmount: 5900,
      paidAmount: 5900,
      status: "PAID",
      items: {
        create: [
          {
            itemId: itm1?.id,
            itemCode: "ITM001",
            itemName: "Sample Product A",
            hsnSac: "8471",
            unit: "PCS",
            qty: 5,
            rate: 1000,
            taxableValue: 5000,
            gstRate: 18,
            cgstAmount: 450,
            sgstAmount: 450,
            igstAmount: 0,
            totalAmount: 5900,
          },
        ],
      },
    },
  });

  // Journal for PUR-00001
  await prisma.journalEntry.create({
    data: {
      voucherType: "Purchase",
      voucherNo: pur.voucherNo,
      referenceId: pur.id,
      narration: `Purchase Bill ${pur.voucherNo}`,
      lines: {
        create: [
          { accountName: "Purchase Account", debit: 5000, credit: 0, narration: "Purchase Taxable" },
          { accountName: "GST Input Credit", debit: 900, credit: 0, narration: "Input Tax Credit" },
          { accountName: "Sundry Creditors", debit: 0, credit: 5900, narration: "By Ganguly Suppliers" },
        ],
      },
    },
  });

  // 9. Initial Receipt Voucher RCT-00001
  await prisma.receiptVoucher.create({
    data: {
      voucherNo: "RCT-00001",
      receiptType: "CUSTOMER",
      customerId: cust1?.id,
      customerCode: cust1?.code,
      invoiceId: inv.id,
      receivedFrom: cust1?.name || "Rahim Traders",
      mode: "Bank",
      amount: 2360,
      narration: `Receipt against ${inv.invoiceNo}`,
      debitAccount: "Bank Account",
      creditAccount: "Sundry Debtors",
    },
  });

  // Journal for RCT-00001
  await prisma.journalEntry.create({
    data: {
      voucherType: "Receipt",
      voucherNo: "RCT-00001",
      narration: `Receipt against ${inv.invoiceNo}`,
      lines: {
        create: [
          { accountName: "Bank Account", debit: 2360, credit: 0, narration: "Bank Received" },
          { accountName: "Sundry Debtors", debit: 0, credit: 2360, narration: "Rahim Traders cleared" },
        ],
      },
    },
  });

  // 10. Initial Payment Voucher PMT-00001
  await prisma.paymentVoucher.create({
    data: {
      voucherNo: "PMT-00001",
      paymentType: "VENDOR",
      vendorId: vend1?.id,
      vendorCode: vend1?.code,
      purchaseBillId: pur.id,
      paidTo: vend1?.name || "Ganguly Suppliers",
      mode: "Bank",
      amount: 5900,
      narration: `Payment against ${pur.voucherNo}`,
      debitAccount: "Sundry Creditors",
      creditAccount: "Bank Account",
      pan: vend1?.pan,
      tdsApplicable: true,
      tdsSection: "194Q",
      tdsRate: 0.1,
      tdsAmount: 5.9,
      netAmount: 5894.1,
    },
  });

  // Journal for PMT-00001
  await prisma.journalEntry.create({
    data: {
      voucherType: "Payment",
      voucherNo: "PMT-00001",
      narration: `Payment against ${pur.voucherNo}`,
      lines: {
        create: [
          { accountName: "Sundry Creditors", debit: 5900, credit: 0, narration: "Ganguly Suppliers paid" },
          { accountName: "Bank Account", debit: 0, credit: 5900, narration: "Paid via Bank" },
        ],
      },
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
