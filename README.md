# 📚 ZIPS-Book | Enterprise ERP & GST Billing System

<p align="center">
  <img src="https://img.shields.io/badge/zips--book-v1.0.0-0a0a0a?style=for-the-badge&logo=next.js&logoColor=white" alt="zips-book">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/License-Proprietary-rose?style=for-the-badge" alt="License">
</p>

---

## 🌟 Overview
**ZIPS-Book** is a modern, dashing, classic full-stack Enterprise ERP and GST Billing Application, engineered to handle end-to-end industrial manufacturing and trading operations.

Modeled strictly from the **18 operational modules of ZIPS-Billing-System.xlsx**, this system enforces **pure double-entry bookkeeping**, automated multi-slab GST calculation (Intra-State CGST+SGST vs Inter-State IGST), real-time stock and ledger updates, printable tax invoices, and full financial reporting (Trial Balance, P&L, Balance Sheet, and GST returns).

- **Author**: Tamal Roy Chowdhury
- **Repository**: [https://github.com/tamaladvanceforging-boop/zips-book](https://github.com/tamaladvanceforging-boop/zips-book)
- **License**: Proprietary (Copyright © 2026 Tamal Roy Chowdhury. All rights reserved.)

---

## ⚡ Key Highlights (Enterprise ERP Capabilities)

1. **Strict Double-Entry Bookkeeping**:
   - Every invoice, purchase bill, payment, and receipt atomically writes corresponding Debit (Dr) and Credit (Cr) legs to the JournalEntry and JournalLine tables.
   - Guaranteed equilibrium: sum(Debit) == sum(Credit).
2. **Instant "Go To" Command Palette (Alt+G / Ctrl+K)**:
   - Jump directly to any of the 18 modules, registers, or reports with keyboard-first navigation.
3. **Function Key Shortcuts**:
   - **F5**: Payment Voucher (Creditors / Bank / Cash)
   - **F6**: Receipt Voucher (Customer collections)
   - **F8**: Tax Sales Invoice
   - **F9**: Purchase Bill (Inward ITC)
4. **Automated GST & State POS Engine**:
   - Identifies POS (Place of Supply) from Customer/Vendor GSTIN / State Code.
   - Automatically bifurcates into **CGST + SGST** (Intra-state) or **IGST** (Inter-state).
   - Real-time conversion of invoice total amounts into Indian Rupees in words (*"Rupees Sixty-One Thousand Three Hundred Sixty Only"*).
5. **Real-time Financial Statements**:
   - **Day Book**: Chronological journal ledger with balanced Dr/Cr check.
   - **Trial Balance**: Instant debit vs credit verification.
   - **Profit & Loss**: Revenue, Cost of Goods Sold (Opening + Inward - Closing), Gross Margin, Expenses, Net Profit.
   - **Balance Sheet**: Assets vs Liabilities & Equity parity.
   - **GSTR-1 & GSTR-3B Tax Summary**: Outward tax liability, Input Tax Credit (ITC), and net payable.
   - **Outstanding Receivables & Payables**: Aging breakdown with overdue markers.
6. **Print-Ready Professional Tax Invoices**:
   - Clean, classic industrial layout with Bank details (IFSC, A/C, Branch), QR UPI block, HSN breakdown, terms & conditions, and authorized signatory.

---

## 🗂️ Module Mapping (from ZIPS-Billing-System.xlsx)

| Excel Sheet Reference | System Feature / Route | Description |
| :--- | :--- | :--- |
| **01. Company Profile** | /company | Enterprise profile, GSTIN, PAN, bank details, default terms |
| **02. Item Master** | /masters/items | HSN/SAC codes, UOM, buy/sell rates, opening & current stock |
| **03. Customer Directory** | /masters/customers | Sundry Debtors, GSTIN, state code, credit limits, balances |
| **04. Vendor Directory** | /masters/vendors | Sundry Creditors, GSTIN, TDS 194Q eligibility, balances |
| **05. Chart of Accounts** | /masters/accounts | 5 Core account groups (Assets, Liab, Equity, Rev, Exp) |
| **06. Sales Invoice Entry** | /vouchers/sales | Dynamic line items, auto-tax, auto-numbering, print modal |
| **07. Purchase Bill Entry** | /vouchers/purchase | Inward stock increment, ITC allocation, vendor ledger update |
| **08. Payment Voucher** | /vouchers/payment | F5 payment to vendors, TDS deduction, Bank/Cash ledger |
| **09. Receipt Voucher** | /vouchers/receipt | F6 receipt from customers, Bank/Cash debit |
| **10. Sales Register** | /registers/sales | Comprehensive sales history with CGST/SGST/IGST breakdown & CSV export |
| **11. Purchase Register** | /registers/purchase | Inward purchases register with ITC tracking & CSV export |
| **12. Day Book** | /registers/daybook | Daily double-entry journal ledger with Dr = Cr validation |
| **13. Outstanding Receivables** | /reports/outstanding | Customer receivables, aging buckets, overdue flags |
| **14. Outstanding Payables** | /reports/outstanding | Vendor payables, aging buckets, overdue flags |
| **15. GST Summary (GSTR-1/3B)** | /reports/gst-summary | Output tax vs Input Tax Credit (ITC) with net liability |
| **16. Trial Balance** | /reports/trial-balance | Real-time debit & credit verification across all ledgers |
| **17. Profit & Loss Statement** | /reports/profit-loss | Revenue, COGS, Gross Profit, Operating Expenses, Net Profit |
| **18. Balance Sheet** | /reports/balance-sheet | Assets = Liabilities + Equity balance verification |

---

## 🛠️ Architecture & Tech Stack

Following the high-performance architectural patterns of dripwall-fullstack-web & modern Next.js 16 fullstack tooling:

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Language**: TypeScript 6 (Strict Mode)
- **Database**: SQLite via Prisma 7 + LibSQL adapter
- **Component Primitives**: shadcn/ui (Tailwind CSS 4, Lucide Icons, next-themes)
- **State & Server Execution**: Server Actions (src/server/*) with strict atomic transactions
- **Tax & Accounting Engine**: Custom pure TypeScript domain logic in src/lib/gstUtils.ts and src/lib/accountingEngine.ts

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** >= 20.x (or Bun v1.2+)
- **npm** >= 10.x or **bun**

### 2. Clone & Install
`ash
git clone https://github.com/tamaladvanceforging-boop/zips-book.git
cd zips-book
npm install
`

### 3. Database Initialization & Seed
`ash
# Push schema to SQLite
npx prisma db push

# Seed initial company, chart of accounts, items, and sample transactions
npm run seed
`

### 4. Run Development Server
`ash
npm run dev
`
Open [http://localhost:3000](http://localhost:3000) in your browser. You will be automatically redirected to the **Enterprise Executive Dashboard**.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| Alt + G / Ctrl + K | Open **"Go To" Quick Jump Command Palette** |
| F5 | Open **Payment Voucher** |
| F6 | Open **Receipt Voucher** |
| F8 | Open **Sales Invoice (Tax Invoice)** |
| F9 | Open **Purchase Bill** |
| Esc | Close Command Palette or modal |

---

## 📜 License
This software is proprietary and confidential. Copyright © 2026 **Tamal Roy Chowdhury**. All rights reserved.
Unauthorized copying, modification, or distribution is strictly prohibited.
