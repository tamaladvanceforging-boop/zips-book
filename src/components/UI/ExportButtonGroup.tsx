"use client";

import { useState, useRef, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Printer,
  ChevronDown,
  FileDown,
  Loader2,
} from "lucide-react";
import {
  exportToExcel,
  exportToPdf,
  exportToWord,
  exportToCsv,
  ExportTableOptions,
} from "@/lib/exportUtils";
import { notify } from "@/lib/notify";

interface ExportButtonGroupProps {
  options?: ExportTableOptions;
  exportOptions?: ExportTableOptions;
  showPrint?: boolean;
  onPrint?: () => void;
  disabled?: boolean;
}

export const ExportButtonGroup = ({
  options,
  exportOptions,
  showPrint = true,
  onPrint,
  disabled = false,
}: ExportButtonGroupProps) => {
  const activeOptions = exportOptions || options;
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExcel = () => {
    if (!activeOptions) return;
    try {
      setExporting("excel");
      exportToExcel(activeOptions);
      notify.success(`Excel spreadsheet "${activeOptions.filename}.xlsx" exported successfully!`);
      setOpen(false);
    } catch (err: any) {
      notify.error(err.message || "Failed to export Excel file");
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = () => {
    if (!activeOptions) return;
    try {
      setExporting("pdf");
      exportToPdf(activeOptions);
      notify.success(`PDF document "${activeOptions.filename}.pdf" generated successfully!`);
      setOpen(false);
    } catch (err: any) {
      notify.error(err.message || "Failed to export PDF file");
    } finally {
      setExporting(null);
    }
  };

  const handleWord = async () => {
    if (!activeOptions) return;
    try {
      setExporting("word");
      await exportToWord(activeOptions);
      notify.success(`Word document "${activeOptions.filename}.docx" exported successfully!`);
      setOpen(false);
    } catch (err: any) {
      notify.error(err.message || "Failed to export Word document");
    } finally {
      setExporting(null);
    }
  };

  const handleCsv = () => {
    if (!activeOptions) return;
    try {
      setExporting("csv");
      exportToCsv({
        filename: activeOptions.filename,
        headers: activeOptions.headers,
        data: activeOptions.data,
      });
      notify.success(`CSV file "${activeOptions.filename}.csv" exported successfully!`);
      setOpen(false);
    } catch (err: any) {
      notify.error(err.message || "Failed to export CSV file");
    } finally {
      setExporting(null);
    }
  };

  const handlePrint = () => {
    setOpen(false);
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || exporting !== null}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-secondary/80 hover:bg-secondary text-foreground border border-border disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        ) : (
          <FileDown className="h-4 w-4 text-emerald-400" />
        )}
        <span>{exporting ? "Exporting..." : "Export / Download"}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-card border border-border shadow-2xl z-50 p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 border-b border-border/50 mb-1">
            Download Format
          </div>

          <button
            type="button"
            onClick={handleExcel}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-emerald-500/10 hover:text-emerald-400 text-foreground transition-colors group"
          >
            <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <div className="font-semibold leading-none">Excel (.xlsx)</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Spreadsheet workbook</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handlePdf}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-rose-500/10 hover:text-rose-400 text-foreground transition-colors group"
          >
            <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <div className="font-semibold leading-none">PDF (.pdf)</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Printable document</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleWord}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-foreground transition-colors group"
          >
            <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30">
              <FileType className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <div className="font-semibold leading-none">Word (.docx)</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Editable document</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCsv}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-purple-500/10 hover:text-purple-400 text-foreground transition-colors group"
          >
            <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <div className="font-semibold leading-none">CSV (.csv)</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Raw data format</div>
            </div>
          </button>

          {showPrint && (
            <>
              <div className="my-1 border-t border-border/50" />
              <button
                type="button"
                onClick={handlePrint}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs rounded-xl hover:bg-secondary text-foreground transition-colors group"
              >
                <div className="p-1 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground">
                  <Printer className="h-3.5 w-3.5" />
                </div>
                <div className="text-left">
                  <div className="font-semibold leading-none">Print View</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Browser print (Ctrl+P)</div>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
