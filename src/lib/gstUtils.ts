// GST, State Codes, Tax Computations and Currency Utilities for ZIPS-Book

export interface StateInfo {
  code: string;
  name: string;
}

export const INDIAN_STATES: StateInfo[] = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];

export const getSupplyType = (
  companyStateCode: string,
  partyStateCode?: string | null
): "Intra-State (CGST+SGST)" | "Inter-State (IGST)" => {
  if (!partyStateCode) return "Intra-State (CGST+SGST)";
  const cleanComp = companyStateCode.trim().padStart(2, "0");
  const cleanParty = partyStateCode.trim().padStart(2, "0");
  return cleanComp === cleanParty
    ? "Intra-State (CGST+SGST)"
    : "Inter-State (IGST)";
};

export interface TaxBreakdown {
  taxableValue: number;
  gstRate: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export const computeGst = (
  taxableValue: number,
  gstRate: number,
  supplyType: "Intra-State (CGST+SGST)" | "Inter-State (IGST)"
): TaxBreakdown => {
  const isIntra = supplyType === "Intra-State (CGST+SGST)";
  const totalTax = (taxableValue * gstRate) / 100;

  if (isIntra) {
    const halfRate = gstRate / 2;
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    return {
      taxableValue,
      gstRate,
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalTax: halfTax * 2,
      totalAmount: Math.round((taxableValue + halfTax * 2) * 100) / 100,
    };
  } else {
    const igstAmount = Math.round(totalTax * 100) / 100;
    return {
      taxableValue,
      gstRate,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: gstRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      totalTax: igstAmount,
      totalAmount: Math.round((taxableValue + igstAmount) * 100) / 100,
    };
  }
};

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"
];

const tens = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
];

function convertLessThanThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + " ";
  }
  return str.trim();
}

export const numberToWordsINR = (num: number): string => {
  if (num === 0) return "Zero Rupees Only";
  const absNum = Math.abs(num);
  const rupees = Math.floor(absNum);
  const paise = Math.round((absNum - rupees) * 100);

  let result = "";

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  const remainder = rem;

  if (crore > 0) {
    result += convertLessThanThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    result += convertLessThanThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    result += convertLessThanThousand(thousand) + " Thousand ";
  }
  if (remainder > 0) {
    result += convertLessThanThousand(remainder) + " ";
  }

  result = result.trim() + " Rupees";

  if (paise > 0) {
    result += " and " + convertLessThanThousand(paise) + " Paise";
  }

  return result + " Only";
};
