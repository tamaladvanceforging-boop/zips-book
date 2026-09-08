import prisma from '../src/lib/dbClient/dbClient';
import { hashPassword } from '../src/lib/auth';

async function main() {
  console.log('Seeding ZIPS-Book Enterprise database...');

  // 1. Clean old data
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.paymentVoucher.deleteMany();
  await prisma.receiptVoucher.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseBillItem.deleteMany();
  await prisma.purchaseBill.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.account.deleteMany();
  await prisma.userCompany.deleteMany();
  await prisma.session.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Tamal Roy Chowdhury (Admin)',
      email: 'admin@zipsbook.com',
      password: hashPassword('admin123'),
      role: 'ADMIN',
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      name: 'Subhasish Sen (Chief Accountant)',
      email: 'accountant@zipsbook.com',
      password: hashPassword('acc123'),
      role: 'ACCOUNTANT',
    },
  });

  console.log('Created users: admin@zipsbook.com, accountant@zipsbook.com');

  // 3. Create Primary Company
  const company = await prisma.company.create({
    data: {
      name: 'Advance Forging Pvt Ltd',
      mailingName: 'Advance Forging Private Limited',
      addressLine1: 'NH-6, Bombay Road, Ankurhati',
      addressLine2: 'Industrial Hub, Domjur',
      city: 'Howrah',
      state: 'West Bengal',
      stateCode: '19',
      pincode: '711409',
      country: 'India',
      currencySymbol: '₹',
      currencyName: 'INR',
      financialYearFrom: new Date('2025-04-01'),
      booksBeginningFrom: new Date('2025-04-01'),
      gstin: '19AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      email: 'accounts@advanceforging.com',
      phone: '9830012345',
      bankName: 'State Bank of India',
      bankAccountNo: '30495839201',
      ifscCode: 'SBIN0000092',
      bankBranch: 'Kolkata Main Branch',
      invoicePrefix: 'INV-',
      nextInvoiceNo: 2,
      purchasePrefix: 'PUR-',
      nextPurchaseNo: 2,
      paymentPrefix: 'PMT-',
      nextPaymentNo: 2,
      receiptPrefix: 'RCT-',
      nextReceiptNo: 2,
    },
  });

  // Link users to company
  await prisma.userCompany.createMany({
    data: [
      { userId: adminUser.id, companyId: company.id, role: 'ADMIN' },
      { userId: accountantUser.id, companyId: company.id, role: 'ACCOUNTANT' },
    ],
  });

  console.log('Created company: ' + company.name);

  // 4. Chart of Accounts (COA)
  const initialAccounts = [
    { code: '1010', name: 'Cash-in-Hand', type: 'Asset', category: 'Current Assets', openingDr: 50000, openingCr: 0, isSystem: true },
    { code: '1020', name: 'State Bank of India', type: 'Asset', category: 'Bank Accounts', openingDr: 250000, openingCr: 0, isSystem: true },
    { code: '1030', name: 'Sundry Debtors', type: 'Asset', category: 'Current Assets', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '1040', name: 'GST Input Credit', type: 'Asset', category: 'Duties & Taxes', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '1070', name: 'Stock / Inventory', type: 'Asset', category: 'Current Assets', openingDr: 150000, openingCr: 0, isSystem: true },
    { code: '1080', name: 'TDS Receivable', type: 'Asset', category: 'Duties & Taxes', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '2010', name: 'Sundry Creditors', type: 'Liability', category: 'Current Liabilities', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '2020', name: 'GST Payable', type: 'Liability', category: 'Duties & Taxes', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '2030', name: 'TDS Payable u/s 194Q', type: 'Liability', category: 'Duties & Taxes', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '3010', name: 'Share Capital Account', type: 'Equity', category: 'Capital', openingDr: 0, openingCr: 450000, isSystem: true },
    { code: '4010', name: 'Sales Account (Domestic)', type: 'Income', category: 'Sales Accounts', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '5010', name: 'Purchase Account', type: 'Expense', category: 'Purchase Accounts', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '5020', name: 'Factory Salary & Wages', type: 'Expense', category: 'Direct Expenses', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '5030', name: 'Factory Rent & Electricity', type: 'Expense', category: 'Indirect Expenses', openingDr: 0, openingCr: 0, isSystem: true },
    { code: '5040', name: 'Freight & Carriage Inward', type: 'Expense', category: 'Direct Expenses', openingDr: 0, openingCr: 0, isSystem: true },
  ];

  for (const acc of initialAccounts) {
    await prisma.account.create({
      data: {
        companyId: company.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        openingDr: acc.openingDr,
        openingCr: acc.openingCr,
        isSystem: acc.isSystem,
      },
    });
  }

  // 5. Item Master
  const item1 = await prisma.item.create({
    data: {
      companyId: company.id,
      code: 'ITM-F01',
      name: 'Forged Steel Flange 150# ANSI',
      hsnSac: '7307',
      unit: 'PCS',
      rate: 2800,
      gstRate: 18,
      stockQty: 85,
    },
  });

  const item2 = await prisma.item.create({
    data: {
      companyId: company.id,
      code: 'ITM-F02',
      name: 'High Tensile Hex Bolt M24',
      hsnSac: '7318',
      unit: 'KGS',
      rate: 145,
      gstRate: 18,
      stockQty: 1200,
    },
  });

  // 6. Customers (Sundry Debtors)
  const cust1 = await prisma.customer.create({
    data: {
      companyId: company.id,
      code: 'CUS-001',
      name: 'L&T Heavy Engineering Ltd',
      address: 'Plot 4A, Heavy Industrial Area',
      state: 'West Bengal',
      stateCode: '19',
      gstin: '19AAACL1234L1Z2',
      phone: '9831122334',
      email: 'procurement@lnthe.com',
      openingBalance: 0,
    },
  });

  await prisma.customer.create({
    data: {
      companyId: company.id,
      code: 'CUS-002',
      name: 'Bharat Heavy Electricals (BHEL)',
      address: 'BHEL House, Siri Fort, New Delhi',
      state: 'Delhi',
      stateCode: '07',
      gstin: '07AAACB5678B1Z9',
      phone: '9810099887',
      email: 'materials@bhel.in',
      openingBalance: 0,
    },
  });

  // 7. Vendors (Sundry Creditors)
  const vend1 = await prisma.vendor.create({
    data: {
      companyId: company.id,
      code: 'VEN-001',
      name: 'Tata Steel Long Products Ltd',
      address: 'Tata Centre, 43 Jawaharlal Nehru Road',
      state: 'West Bengal',
      stateCode: '19',
      gstin: '19AAACT0001T1Z5',
      phone: '9830055443',
      email: 'sales@tatasteel.com',
      pan: 'AAACT0001T',
      tdsApplicable: true,
      tdsSection: '194Q',
      tdsRate: 0.1,
      openingBalance: 0,
    },
  });

  await prisma.vendor.create({
    data: {
      companyId: company.id,
      code: 'VEN-002',
      name: 'Jindal Stainless Rolling Mills',
      address: 'Industrial Focal Point, Hisar',
      state: 'Haryana',
      stateCode: '06',
      gstin: '06AAACJ9999J1Z1',
      phone: '9812345678',
      email: 'order@jindalstainless.com',
      pan: 'AAACJ9999J',
      tdsApplicable: true,
      tdsSection: '194Q',
      tdsRate: 0.1,
      openingBalance: 0,
    },
  });

  // 8. Sample Sales Invoice
  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      invoiceNo: 'INV-001',
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customerId: cust1.id,
      customerName: cust1.name,
      customerAddress: cust1.address,
      customerGstin: cust1.gstin,
      customerState: cust1.state,
      customerStateCode: cust1.stateCode,
      supplyType: 'Intra-State (CGST+SGST)',
      taxableValue: 56000,
      cgstAmount: 5040,
      sgstAmount: 5040,
      igstAmount: 0,
      roundOff: 0,
      totalAmount: 66080,
      paidAmount: 0,
      status: 'POSTED',
      notes: 'Supply of ANSI 150# Flanges as per PO #LNT/2025/998',
      items: {
        create: [
          {
            itemId: item1.id,
            itemCode: item1.code,
            itemName: item1.name,
            hsnSac: item1.hsnSac,
            unit: item1.unit,
            qty: 20,
            rate: item1.rate,
            taxableValue: 56000,
            gstRate: 18,
            cgstAmount: 5040,
            sgstAmount: 5040,
            igstAmount: 0,
            totalAmount: 66080,
          },
        ],
      },
    },
  });

  // 9. Sample Purchase Bill
  const purchaseBill = await prisma.purchaseBill.create({
    data: {
      companyId: company.id,
      voucherNo: 'PUR-001',
      vendorBillNo: 'TSL/WB/2025/4412',
      billDate: new Date(),
      vendorId: vend1.id,
      vendorName: vend1.name,
      vendorAddress: vend1.address,
      vendorGstin: vend1.gstin,
      vendorState: vend1.state,
      vendorStateCode: vend1.stateCode,
      supplyType: 'Intra-State (CGST+SGST)',
      taxableValue: 72500,
      cgstAmount: 6525,
      sgstAmount: 6525,
      igstAmount: 0,
      roundOff: 0,
      totalAmount: 85550,
      paidAmount: 0,
      status: 'POSTED',
      notes: 'Inward Round Billet supply for forging plant',
      items: {
        create: [
          {
            itemId: item2.id,
            itemCode: item2.code,
            itemName: item2.name,
            hsnSac: item2.hsnSac,
            unit: item2.unit,
            qty: 500,
            rate: 145,
            taxableValue: 72500,
            gstRate: 18,
            cgstAmount: 6525,
            sgstAmount: 6525,
            igstAmount: 0,
            totalAmount: 85550,
          },
        ],
      },
    },
  });

  // 10. Sample Payment Voucher (F5)
  await prisma.paymentVoucher.create({
    data: {
      companyId: company.id,
      voucherNo: 'PMT-001',
      date: new Date(),
      paymentType: 'VENDOR',
      vendorId: vend1.id,
      vendorCode: vend1.code,
      paidTo: vend1.name,
      purchaseBillId: purchaseBill.id,
      mode: 'Bank (NEFT)',
      amount: 40000,
      narration: 'Part payment towards Tata Steel bill TSL/WB/2025/4412',
      debitAccount: 'Sundry Creditors',
      creditAccount: 'State Bank of India',
      tdsApplicable: true,
      tdsSection: '194Q',
      tdsRate: 0.1,
      tdsAmount: 40,
      netAmount: 39960,
    },
  });

  // 11. Sample Receipt Voucher (F6)
  await prisma.receiptVoucher.create({
    data: {
      companyId: company.id,
      voucherNo: 'RCT-001',
      date: new Date(),
      receiptType: 'CUSTOMER',
      customerId: cust1.id,
      customerCode: cust1.code,
      receivedFrom: cust1.name,
      invoiceId: invoice.id,
      mode: 'Bank (RTGS)',
      amount: 30000,
      narration: 'Advance received for PO #LNT/2025/998 against INV-001',
      debitAccount: 'State Bank of India',
      creditAccount: 'Sundry Debtors',
    },
  });

  // 12. Balanced Journal Entries for Day Book
  // Sales Journal
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      voucherType: 'Sales',
      voucherNo: invoice.invoiceNo,
      entryDate: invoice.invoiceDate,
      narration: 'Sales to ' + cust1.name + ' - Inv ' + invoice.invoiceNo,
      lines: {
        create: [
          { accountName: 'Sundry Debtors', debit: 66080, credit: 0, narration: 'Receivable from L&T' },
          { accountName: 'Sales Account', debit: 0, credit: 56000, narration: 'Domestic Sales Revenue' },
          { accountName: 'GST Payable', debit: 0, credit: 10080, narration: 'Output CGST + SGST (18%)' },
        ],
      },
    },
  });

  // Purchase Journal
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      voucherType: 'Purchase',
      voucherNo: purchaseBill.voucherNo,
      entryDate: purchaseBill.billDate,
      narration: 'Purchase from ' + vend1.name + ' - Bill ' + purchaseBill.voucherNo,
      lines: {
        create: [
          { accountName: 'Purchase Account', debit: 72500, credit: 0, narration: 'Raw Material Purchases' },
          { accountName: 'GST Input Credit', debit: 13050, credit: 0, narration: 'Input CGST + SGST (18%)' },
          { accountName: 'Sundry Creditors', debit: 0, credit: 85550, narration: 'Payable to Tata Steel' },
        ],
      },
    },
  });

  // Payment Journal
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      voucherType: 'Payment',
      voucherNo: 'PMT-001',
      entryDate: new Date(),
      narration: 'Payment to ' + vend1.name + ' via NEFT',
      lines: {
        create: [
          { accountName: 'Sundry Creditors', debit: 40000, credit: 0, narration: 'Settlement towards bill' },
          { accountName: 'State Bank of India', debit: 0, credit: 39960, narration: 'Bank transfer' },
          { accountName: 'TDS Payable', debit: 0, credit: 40, narration: 'TDS u/s 194Q' },
        ],
      },
    },
  });

  // Receipt Journal
  await prisma.journalEntry.create({
    data: {
      companyId: company.id,
      voucherType: 'Receipt',
      voucherNo: 'RCT-001',
      entryDate: new Date(),
      narration: 'Receipt from ' + cust1.name + ' via RTGS',
      lines: {
        create: [
          { accountName: 'State Bank of India', debit: 30000, credit: 0, narration: 'Bank deposit' },
          { accountName: 'Sundry Debtors', debit: 0, credit: 30000, narration: 'Customer receipt' },
        ],
      },
    },
  });

  console.log('✅ ZIPS-Book Enterprise seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
