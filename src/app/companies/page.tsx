"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  PlusCircle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  Calendar, 
  MapPin, 
  Settings2, 
  PowerOff,
  Search,
  RefreshCw
} from "lucide-react";
import { getCompaniesAction, switchCompanyAction, shutCompanyAction } from "@/server/company/companyActions";

export default function CompaniesGatewayPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    const res = await getCompaniesAction();
    setCompanies(res.companies || []);
    setActiveCompanyId(res.activeCompanyId || null);
    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSelectCompany = async (companyId: string) => {
    setSwitching(companyId);
    const res = await switchCompanyAction(companyId);
    if (res.success) {
      setActiveCompanyId(companyId);
      router.push("/dashboard" as any);
      router.refresh();
    } else {
      setSwitching(null);
    }
  };

  const handleShutCompany = async () => {
    await shutCompanyAction();
    setActiveCompanyId(null);
    loadCompanies();
  };

  const filtered = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstin.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Tally Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-zinc-900 to-emerald-950 text-white border border-emerald-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Building2 className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Building2 className="h-3.5 w-3.5" />
              Gateway of Tally • Company Management
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
              Select or Create Enterprise Company
            </h1>
            <p className="text-xs md:text-sm text-zinc-400 max-w-2xl">
              Choose an active enterprise workspace to manage Day Book, Vouchers, Invoicing, and Tax returns. Each company maintains completely isolated books and financial ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={"/companies/create" as any}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs md:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Create Company (F3)
            </Link>

            {activeCompanyId && (
              <button
                onClick={handleShutCompany}
                className="px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-all flex items-center gap-1.5"
                title="Shut Current Active Company"
              >
                <PowerOff className="h-3.5 w-3.5 text-rose-400" />
                Shut Co (Alt+F1)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, GSTIN, state..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border-input"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Total Companies: <strong className="text-foreground font-semibold">{companies.length}</strong></span>
          <span>•</span>
          <button 
            onClick={loadCompanies} 
            className="hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>
      </div>

      {/* Company Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
          <div className="h-6 w-6 border-2 border-emerald-500/40 border-t-emerald-500 rounded-full animate-spin" />
          Loading company directory...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-4">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">No Companies Found</h3>
            <p className="text-xs text-muted-foreground">
              {search ? "No company matched your search query." : "No enterprise companies have been configured yet."}
            </p>
          </div>
          <Link
            href={"/companies/create" as any}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
          >
            <PlusCircle className="h-4 w-4" />
            Create First Company
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((co) => {
            const isActive = co.id === activeCompanyId;
            return (
              <div
                key={co.id}
                className={`relative rounded-2xl border p-5 transition-all flex flex-col justify-between group ${
                  isActive 
                    ? "border-emerald-500/60 bg-emerald-500/[0.03] shadow-md shadow-emerald-500/10" 
                    : "border-border hover:border-zinc-400/50 bg-card hover:shadow-sm"
                }`}
              >
                {/* Active Indicator Ribbon */}
                {isActive && (
                  <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active Workspace
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-base ${
                        isActive 
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20" 
                          : "bg-muted text-foreground"
                      }`}>
                        {co.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground group-hover:text-emerald-500 transition-colors line-clamp-1">
                          {co.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {co.mailingName || co.name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata pills */}
                  <div className="space-y-2 pt-2 border-t border-border/80 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        Financial Year:
                      </span>
                      <span className="font-semibold text-foreground font-mono">
                        {new Date(co.financialYearFrom).getFullYear()} - {new Date(co.financialYearFrom).getFullYear() + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-zinc-400" />
                        GSTIN:
                      </span>
                      <span className="font-semibold text-foreground font-mono">
                        {co.gstin}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                        State / POS:
                      </span>
                      <span className="font-medium text-foreground truncate max-w-[150px]">
                        {co.state} ({co.stateCode})
                      </span>
                    </div>
                  </div>

                  {/* Counts row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-center bg-muted/40 rounded-xl p-2 text-xs">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Invoices</p>
                      <p className="font-bold text-foreground">{co._count?.invoices || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Bills</p>
                      <p className="font-bold text-foreground">{co._count?.purchaseBills || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Catalog</p>
                      <p className="font-bold text-foreground">{co._count?.items || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Bottom action buttons */}
                <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                  <Link
                    href={"/company" as any}
                    className="p-2 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 transition-colors"
                    title="Alter Company Profile (Alt+F3)"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    Alter (Alt+F3)
                  </Link>

                  <button
                    onClick={() => handleSelectCompany(co.id)}
                    disabled={switching === co.id}
                    className={`px-3.5 py-2 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white"
                        : "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                    }`}
                  >
                    {switching === co.id ? (
                      <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : isActive ? (
                      <>
                        Open Dashboard
                        <ArrowRight className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Select Company
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
