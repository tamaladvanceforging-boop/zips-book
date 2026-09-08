# playwright-cli cheat-sheet

Running record of UI element names, routes, form shapes, and flow gotchas discovered while testing with Playwright. Consult before scanning snapshots. Append new learnings as they are discovered.

## Routes

| Route | Purpose | Access Rule |
|---|---|---|
| `/` | Root entry gatekeeper | Redirects to `/auth/login` if unauthenticated, to `/companies` if no active company, or to `/dashboard` if both exist |
| `/auth/login` | User login | Public |
| `/auth/register` | User signup | Public |
| `/companies` | Select Company Gateway | Requires active user session |
| `/companies/create` | Create Company (`F3`) | Requires active user session |
| `/company` | Alter Company (`Alt+F3`) | Requires active company |
| `/dashboard` | Gateway of Tally | Requires active user & active company |
| `/masters/items` | Item Master | Stock items, HSN/SAC, units, GST rates |
| `/masters/customers` | Customer Master | Sundry Debtors, GSTIN, states |
| `/masters/vendors` | Vendor Master | Sundry Creditors, GSTIN, states |
| `/masters/accounts` | Chart of Accounts | Balance sheet & P&L ledger accounts |
| `/vouchers/sales` | Tax Invoice (`F8`) | Sales invoice generation with GST breakup |
| `/vouchers/purchase` | Purchase Bill (`F9`) | Inward supply recording with ITC |
| `/vouchers/payment` | Payment Voucher (`F5`) | Vendor payments and expense disbursements |
| `/vouchers/receipt` | Receipt Voucher (`F6`) | Customer receipts and revenue inflows |
| `/vouchers/contra` | Contra Voucher (`F4`) | Internal cash and bank account transfers |
| `/vouchers/journal` | Journal Voucher (`F7`) | Multi-line double entry adjustment |
| `/vouchers/credit-note` | Credit Note (`Alt+F6`) | Sales Return & Section 34 GST reduction |
| `/vouchers/debit-note` | Debit Note (`Alt+F5`) | Purchase Return & Section 34 ITC reversal |
| `/registers/sales` | Sales Register | Outward supplies GSTR-1 register |
| `/registers/purchase` | Purchase Register | Inward supplies register |
| `/registers/credit-notes` | Credit Note Register | Sales return and GST output reversal register |
| `/registers/debit-notes` | Debit Note Register | Purchase return and ITC reversal register |
| `/registers/daybook` | Day Book | Complete chronological double entry journal |
| `/reports/outstanding` | Outstanding O/S | Receivables and payables aging & balances |
| `/reports/gst-summary` | GST Summary | GSTR-1 and GSTR-3B tax computation |
| `/reports/trial-balance` | Trial Balance | Double-entry debit/credit reconciliation |
| `/reports/profit-loss` | Profit & Loss | Gross profit, COGS, expenses, net profit |
| `/reports/balance-sheet` | Balance Sheet | Assets, Liabilities, and Owner Equity |

## UI element names

- **App Header**:
  - Company Selector dropdown button
  - Search trigger `Ctrl+K / Alt+G`
  - Quick Voucher shortcuts: Sales (`F8`), Payment (`F5`), Receipt (`F6`)
  - User profile badge & Theme toggle
- **Sidebar**:
  - Sections: `Gateway & Company`, `Masters`, `Vouchers (Entry)`, `Registers`, `Financial Statements`
  - Hotkey indicators: `F1`, `F3`, `Alt+F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `Alt+F5`, `Alt+F6`
- **Command Palette (`Ctrl+K` or `Alt+G`)**:
  - Search input with auto-filtering across all 26 ERP commands
  - Fast keyboard triggers: `F1`-`F9`, `Alt+F3`, `Alt+F5`, `Alt+F6`

## Form shapes

- **Contra Voucher (`F4`)**:
  - Transfer Types: `CASH_TO_BANK`, `BANK_TO_CASH`, `BANK_TO_BANK`
  - Source Account (Cr / Outflow)
  - Target Account (Dr / Inflow)
  - Amount (₹) + words auto-generator
- **Journal Voucher (`F7`)**:
  - Header: Voucher No, Date, Reference
  - Dynamic rows: By/To (Dr/Cr), Account Datalist, Debit (₹), Credit (₹), Narration
  - Real-time balance difference indicator (`Diff: ₹0.00` with green balanced badge)
- **Credit Note (`Alt+F6`)**:
  - Customer selection, Original Invoice No & Date
  - Reason (Sales Return, Deficiency in Service, Price Adjustment)
  - Line items with auto-calculated CGST, SGST, IGST and preview modal
- **Debit Note (`Alt+F5`)**:
  - Vendor selection, Original Bill No & Date
  - Reason (Purchase Return, Rejection of Goods, Rate Difference)
  - Line items with auto-calculated ITC reversal and preview modal

## Flow gotchas

- Root path `/` redirects unauthenticated users to `/auth/login`. Do not assume users land on `/dashboard`.
- Multi-company architecture stores the active company ID in an encrypted cookie (`active_company_id`). When switching companies, always ensure all dependent registers revalidate their caches.
- Double-entry accounting integrity requires equal Debits and Credits before any voucher can be submitted.
