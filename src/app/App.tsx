import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Minus, Pencil, Trash2, X, Check, PiggyBank, ArrowLeft, ArrowRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Currency = "SEK" | "TWD";
type TxType = "add" | "reduce";

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
}

interface Kid {
  id: string;
  name: string;
  color: string;
  accentBg: string;
  transactions: Transaction[];
}

interface ModalState {
  kidId: string;
  editId?: string;
  type: TxType;
  amount: string;
  currency: Currency;
  description: string;
  date: string;
}

type Page = "dashboard" | { kind: "transactions"; kidId: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES: Currency[] = ["SEK", "TWD"];

const SYMBOLS: Record<Currency, string> = { SEK: "kr", TWD: "NT$" };

const KID_COLORS = {
  kid1: { color: "#282633", accentBg: "#EEEEF2" },
  kid2: { color: "#FF8687", accentBg: "#FFF0F0" },
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getBalance(transactions: Transaction[], currency: Currency): number {
  return transactions
    .filter((t) => t.currency === currency)
    .reduce((acc, t) => (t.type === "add" ? acc + t.amount : acc - t.amount), 0);
}

function formatAmt(amount: number, currency: Currency): string {
  const abs = Math.abs(amount);
  if (currency === "SEK") return `${abs.toFixed(2)} kr`;
  return `NT$${abs.toFixed(0)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const INITIAL_KIDS: Kid[] = [
  {
    id: "kid1",
    name: "Alex",
    ...KID_COLORS.kid1,
    transactions: [
      { id: "t1", type: "add", amount: 200, currency: "SEK", description: "Weekly allowance", date: "2026-07-01" },
      { id: "t2", type: "reduce", amount: 45, currency: "SEK", description: "Ice cream & snacks", date: "2026-07-08" },
      { id: "t3", type: "add", amount: 500, currency: "TWD", description: "Grandma birthday gift", date: "2026-07-15" },
      { id: "t4", type: "add", amount: 200, currency: "SEK", description: "Weekly allowance", date: "2026-07-08" },
      { id: "t5", type: "reduce", amount: 60, currency: "SEK", description: "Toy car", date: "2026-07-17" },
    ],
  },
  {
    id: "kid2",
    name: "Sam",
    ...KID_COLORS.kid2,
    transactions: [
      { id: "t6", type: "add", amount: 1200, currency: "TWD", description: "Birthday money", date: "2026-07-03" },
      { id: "t7", type: "add", amount: 200, currency: "SEK", description: "Chores bonus", date: "2026-07-10" },
      { id: "t8", type: "reduce", amount: 350, currency: "TWD", description: "Comic books set", date: "2026-07-20" },
      { id: "t9", type: "add", amount: 150, currency: "SEK", description: "Weekly allowance", date: "2026-07-15" },
    ],
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [kids, setKids] = useState<Kid[]>(INITIAL_KIDS);
  const [page, setPage] = useState<Page>("dashboard");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNameId) nameRef.current?.focus();
  }, [editingNameId]);

  const chartData = CURRENCIES.map((cur) => {
    const row: Record<string, string | number> = { currency: cur };
    kids.forEach((k) => { row[k.name] = Math.max(0, getBalance(k.transactions, cur)); });
    return row;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAdd(kidId: string, type: TxType) {
    setModal({ kidId, type, amount: "", currency: "SEK", description: "", date: today() });
  }

  function openEdit(kidId: string, tx: Transaction) {
    setModal({ kidId, editId: tx.id, type: tx.type, amount: String(tx.amount), currency: tx.currency, description: tx.description, date: tx.date });
  }

  function saveModal() {
    if (!modal) return;
    const amt = parseFloat(modal.amount);
    if (isNaN(amt) || amt <= 0 || !modal.description.trim() || !modal.date) return;
    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== modal.kidId) return k;
        const newTx: Transaction = { id: modal.editId ?? uid(), type: modal.type, amount: amt, currency: modal.currency, description: modal.description.trim(), date: modal.date };
        if (modal.editId) return { ...k, transactions: k.transactions.map((t) => (t.id === modal.editId ? newTx : t)) };
        return { ...k, transactions: [...k.transactions, newTx] };
      })
    );
    setModal(null);
  }

  function deleteTx(kidId: string, txId: string) {
    setKids((prev) => prev.map((k) => k.id === kidId ? { ...k, transactions: k.transactions.filter((t) => t.id !== txId) } : k));
  }

  function startEditName(kid: Kid) {
    setEditingNameId(kid.id);
    setNameInput(kid.name);
  }

  function saveName(kidId: string) {
    if (!nameInput.trim()) { setEditingNameId(null); return; }
    setKids((prev) => prev.map((k) => (k.id === kidId ? { ...k, name: nameInput.trim() } : k)));
    setEditingNameId(null);
  }

  // ── Page routing ──────────────────────────────────────────────────────────

  if (page !== "dashboard") {
    const kid = kids.find((k) => k.id === page.kidId)!;
    return (
      <TransactionsPage
        kid={kid}
        onBack={() => setPage("dashboard")}
        onAdd={(type) => openAdd(kid.id, type)}
        onEdit={(tx) => openEdit(kid.id, tx)}
        onDelete={(txId) => deleteTx(kid.id, txId)}
        modal={modal}
        kids={kids}
        onModalChange={setModal}
        onModalSave={saveModal}
        onModalClose={() => setModal(null)}
      />
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Memphis decorative shapes */}
      <Decorations />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FF8687" }}>
              <PiggyBank className="text-white" size={26} />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight leading-none" style={{ fontFamily: "'Fredoka', sans-serif", color: "#282633" }}>
                PiggyBank
              </h1>
              <p className="text-xs mt-0.5" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>
                family budget tracker
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {CURRENCIES.map((cur) => (
              <span key={cur} className="px-3 py-1.5 rounded-xl text-xs font-medium border border-border" style={{ fontFamily: "'DM Mono', monospace", color: "#282633", background: "#EEEEF2" }}>
                {cur} {SYMBOLS[cur]}
              </span>
            ))}
          </div>
        </header>

        {/* Kid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {kids.map((kid) => (
            <DashboardKidCard
              key={kid.id}
              kid={kid}
              editingName={editingNameId === kid.id}
              nameInput={nameInput}
              nameRef={editingNameId === kid.id ? nameRef : undefined}
              onStartEditName={() => startEditName(kid)}
              onNameInput={setNameInput}
              onSaveName={() => saveName(kid.id)}
              onCancelName={() => setEditingNameId(null)}
              onAdd={(type) => openAdd(kid.id, type)}
              onViewAll={() => setPage({ kind: "transactions", kidId: kid.id })}
            />
          ))}
        </div>

        {/* Comparison Chart */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Fredoka', sans-serif" }}>
            Balance Comparison
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={6} barCategoryGap="40%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,43,53,0.06)" vertical={false} />
              <XAxis dataKey="currency" tick={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fill: "#9A9AAA" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fill: "#9A9AAA" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip
                cursor={{ fill: "rgba(43,43,53,0.04)" }}
                contentStyle={{ fontFamily: "'DM Mono', monospace", fontSize: 12, borderRadius: 12, border: "1px solid rgba(43,43,53,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
                formatter={(val: number, name: string) => [`${val.toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, paddingTop: 16 }} />
              {kids.map((kid) => (
                <Bar key={kid.id} dataKey={kid.name} fill={kid.color} radius={[8, 8, 0, 0]} maxBarSize={80} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {modal && (
        <TransactionModal modal={modal} kids={kids} onChange={setModal} onSave={saveModal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

// ─── Dashboard Kid Card ───────────────────────────────────────────────────────

interface DashboardKidCardProps {
  kid: Kid;
  editingName: boolean;
  nameInput: string;
  nameRef?: React.RefObject<HTMLInputElement | null>;
  onStartEditName: () => void;
  onNameInput: (v: string) => void;
  onSaveName: () => void;
  onCancelName: () => void;
  onAdd: (type: TxType) => void;
  onViewAll: () => void;
}

function DashboardKidCard({ kid, editingName, nameInput, nameRef, onStartEditName, onNameInput, onSaveName, onCancelName, onAdd, onViewAll }: DashboardKidCardProps) {
  const recent = [...kid.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="h-1.5 w-full" style={{ background: kid.color }} />

      <div className="p-5 flex flex-col gap-5 flex-1">
        {/* Name + buttons */}
        <div className="flex items-center justify-between gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameRef as React.RefObject<HTMLInputElement>}
                value={nameInput}
                onChange={(e) => onNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSaveName(); if (e.key === "Escape") onCancelName(); }}
                className="text-2xl font-bold bg-transparent border-b-2 outline-none w-32 pb-0.5"
                style={{ fontFamily: "'Fredoka', sans-serif", borderColor: kid.color }}
                maxLength={20}
              />
              <button onClick={onSaveName} className="p-1 rounded-full hover:bg-muted transition-colors"><Check size={15} style={{ color: kid.color }} /></button>
              <button onClick={onCancelName} className="p-1 rounded-full hover:bg-muted transition-colors"><X size={15} className="text-muted-foreground" /></button>
            </div>
          ) : (
            <button
              onClick={onStartEditName}
              className="text-2xl font-bold hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 group"
              style={{ fontFamily: "'Fredoka', sans-serif", color: "#282633" }}
            >
              {kid.name}
              <Pencil size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onAdd("add")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: kid.color, fontFamily: "'Lexend', sans-serif" }}
            >
              <Plus size={13} /> Earn
            </button>
            <button
              onClick={() => onAdd("reduce")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 border"
              style={{ color: kid.color, borderColor: kid.color, background: kid.accentBg, fontFamily: "'Lexend', sans-serif" }}
            >
              <Minus size={13} /> Spend
            </button>
          </div>
        </div>

        {/* Balances */}
        <div className="flex gap-3">
          {CURRENCIES.map((cur) => {
            const bal = getBalance(kid.transactions, cur);
            return (
              <div key={cur} className="flex-1 rounded-xl px-4 py-3" style={{ background: kid.accentBg }}>
                <div className="text-xs mb-1 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>{cur}</div>
                <div className="text-xl font-bold tabular-nums" style={{ fontFamily: "'DM Mono', monospace", color: bal < 0 ? "#FF8687" : kid.color }}>
                  {bal < 0 ? "−" : ""}{formatAmt(Math.abs(bal), cur)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent transactions preview */}
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>Recent</div>
          {recent.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No transactions yet.</p>
          )}
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: tx.type === "add" ? "#22C55E" : "#EF4444" }}>
                {tx.type === "add" ? <Plus size={10} /> : <Minus size={10} />}
              </div>
              <span className="text-sm flex-1 truncate" style={{ fontFamily: "'Lexend', sans-serif" }}>{tx.description}</span>
              <span className="text-sm tabular-nums flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace", color: tx.type === "add" ? "#22C55E" : "#EF4444" }}>
                {tx.type === "add" ? "+" : "−"}{formatAmt(tx.amount, tx.currency)}
              </span>
            </div>
          ))}
        </div>

        {/* View all link */}
        <button
          onClick={onViewAll}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-95"
          style={{ background: kid.accentBg, color: kid.color, fontFamily: "'Lexend', sans-serif" }}
        >
          <span>View all {kid.transactions.length} transactions</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────────────────────────────

interface TransactionsPageProps {
  kid: Kid;
  onBack: () => void;
  onAdd: (type: TxType) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => void;
  modal: ModalState | null;
  kids: Kid[];
  onModalChange: (m: ModalState) => void;
  onModalSave: () => void;
  onModalClose: () => void;
}

function TransactionsPage({ kid, onBack, onAdd, onEdit, onDelete, modal, kids, onModalChange, onModalSave, onModalClose }: TransactionsPageProps) {
  const [filterCurrency, setFilterCurrency] = useState<Currency | "all">("all");
  const [filterType, setFilterType] = useState<TxType | "all">("all");

  const sorted = [...kid.transactions]
    .filter((t) => filterCurrency === "all" || t.currency === filterCurrency)
    .filter((t) => filterType === "all" || t.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date));

  const sekBal = getBalance(kid.transactions, "SEK");
  const twdBal = getBalance(kid.transactions, "TWD");

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Lexend', sans-serif" }}>
      <Decorations />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* Back nav */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium mb-8 group hover:opacity-70 transition-opacity"
          style={{ color: "#9A9AAA", fontFamily: "'Lexend', sans-serif" }}
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Back to dashboard
        </button>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-4 h-10 rounded-full" style={{ background: kid.color }} />
              <h1 className="text-4xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#282633" }}>
                {kid.name}'s Transactions
              </h1>
            </div>
            <p className="text-sm pl-7" style={{ color: "#9A9AAA", fontFamily: "'DM Mono', monospace" }}>
              {kid.transactions.length} records
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => onAdd("add")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: kid.color }}
            >
              <Plus size={14} /> Earn
            </button>
            <button
              onClick={() => onAdd("reduce")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 border"
              style={{ color: kid.color, borderColor: kid.color, background: kid.accentBg }}
            >
              <Minus size={14} /> Spend
            </button>
          </div>
        </div>

        {/* Balance summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {([["SEK", sekBal], ["TWD", twdBal]] as [Currency, number][]).map(([cur, bal]) => (
            <div key={cur} className="bg-card rounded-2xl border border-border px-6 py-5 shadow-sm">
              <div className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>
                {cur} balance
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ fontFamily: "'DM Mono', monospace", color: bal < 0 ? "#FF8687" : kid.color }}>
                {bal < 0 ? "−" : ""}{formatAmt(Math.abs(bal), cur)}
              </div>
              <div className="text-xs mt-2" style={{ color: "#9A9AAA", fontFamily: "'DM Mono', monospace" }}>
                {kid.transactions.filter((t) => t.currency === cur).length} transactions
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          <FilterPill active={filterCurrency === "all"} color={kid.color} onClick={() => setFilterCurrency("all")}>All currencies</FilterPill>
          {CURRENCIES.map((c) => (
            <FilterPill key={c} active={filterCurrency === c} color={kid.color} onClick={() => setFilterCurrency(c)}>{c}</FilterPill>
          ))}
          <div className="w-px bg-border mx-1 self-stretch" />
          <FilterPill active={filterType === "all"} color={kid.color} onClick={() => setFilterType("all")}>All types</FilterPill>
          <FilterPill active={filterType === "add"} color={kid.color} onClick={() => setFilterType("add")}>Income</FilterPill>
          <FilterPill active={filterType === "reduce"} color={kid.color} onClick={() => setFilterType("reduce")}>Spending</FilterPill>
        </div>

        {/* Transaction list */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {sorted.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No transactions match the filter.</div>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((tx, i) => (
                <FullTxRow
                  key={tx.id}
                  tx={tx}
                  kidColor={kid.color}
                  isFirst={i === 0}
                  onEdit={() => onEdit(tx)}
                  onDelete={() => onDelete(tx.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <TransactionModal modal={modal} kids={kids} onChange={onModalChange} onSave={onModalSave} onClose={onModalClose} />
      )}
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({ children, active, color, onClick }: { children: React.ReactNode; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
      style={{
        fontFamily: "'Lexend', sans-serif",
        background: active ? color : "transparent",
        color: active ? "#fff" : "#7A7A8C",
        borderColor: active ? color : "rgba(43,43,53,0.12)",
      }}
    >
      {children}
    </button>
  );
}

// ─── Full Transaction Row ─────────────────────────────────────────────────────

function FullTxRow({ tx, kidColor, isFirst, onEdit, onDelete }: {
  tx: Transaction;
  kidColor: string;
  isFirst: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAdd = tx.type === "add";
  return (
    <div className="flex items-center gap-4 px-6 py-4 group hover:bg-muted/40 transition-colors">
      {/* Icon */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white" style={{ background: isAdd ? kidColor : "#FF8687" }}>
        {isAdd ? <Plus size={15} /> : <Minus size={15} />}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ fontFamily: "'Lexend', sans-serif", color: "#282633" }}>
          {tx.description}
        </div>
        <div className="text-xs mt-0.5" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>
          {formatDate(tx.date)}
        </div>
      </div>

      {/* Currency badge */}
      <div className="px-2 py-0.5 rounded-md text-xs flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace", background: "#EEEEF2", color: "#7A7A8C" }}>
        {tx.currency}
      </div>

      {/* Amount */}
      <div className="text-base font-semibold tabular-nums flex-shrink-0 w-28 text-right" style={{ fontFamily: "'DM Mono', monospace", color: isAdd ? kidColor : "#FF8687" }}>
        {isAdd ? "+" : "−"}{formatAmt(tx.amount, tx.currency)}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={onEdit} className="p-2 rounded-lg hover:bg-background transition-colors" aria-label="Edit">
          <Pencil size={14} className="text-muted-foreground" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-red-50 transition-colors" aria-label="Delete">
          <Trash2 size={14} style={{ color: "#FF8687" }} />
        </button>
      </div>
    </div>
  );
}

// ─── Transaction Modal ────────────────────────────────────────────────────────

function TransactionModal({ modal, kids, onChange, onSave, onClose }: {
  modal: ModalState;
  kids: Kid[];
  onChange: (m: ModalState) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const kid = kids.find((k) => k.id === modal.kidId)!;
  const isEdit = !!modal.editId;
  const isValid = modal.description.trim().length > 0 && parseFloat(modal.amount) > 0 && !!modal.date;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(43,43,53,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: kid.color }} />
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold" style={{ fontFamily: "'Fredoka', sans-serif", color: "#282633" }}>
              {isEdit ? "Edit Transaction" : modal.type === "add" ? `Add Money` : `Spend Money`}
              <span className="ml-2 text-base font-normal" style={{ color: kid.color }}>— {kid.name}</span>
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Type toggle */}
            {!isEdit && (
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(["add", "reduce"] as TxType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChange({ ...modal, type: t })}
                    className="flex-1 py-2.5 text-sm font-medium transition-colors"
                    style={{ fontFamily: "'Lexend', sans-serif", background: modal.type === t ? kid.color : "transparent", color: modal.type === t ? "#fff" : "#9A9AAA" }}
                  >
                    {t === "add" ? "Add Money" : "Spend"}
                  </button>
                ))}
              </div>
            )}

            {/* Amount + Currency */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>Amount</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={modal.amount}
                  onChange={(e) => onChange({ ...modal, amount: e.target.value })}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-current transition-colors"
                  style={{ fontFamily: "'DM Mono', monospace", borderColor: "transparent" }}
                  onFocus={(e) => { e.target.style.borderColor = kid.color + "60"; }}
                  onBlur={(e) => { e.target.style.borderColor = "transparent"; }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>Currency</label>
                <select
                  value={modal.currency}
                  onChange={(e) => onChange({ ...modal, currency: e.target.value as Currency })}
                  className="bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none h-[42px] cursor-pointer border border-transparent"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>Description</label>
              <input
                type="text" placeholder="What is this for?"
                value={modal.description}
                onChange={(e) => onChange({ ...modal, description: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && isValid) onSave(); }}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent transition-colors"
                style={{ fontFamily: "'Lexend', sans-serif" }}
                onFocus={(e) => { e.target.style.borderColor = kid.color + "60"; }}
                onBlur={(e) => { e.target.style.borderColor = "transparent"; }}
                maxLength={60}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace", color: "#9A9AAA" }}>Date</label>
              <input
                type="date" value={modal.date}
                onChange={(e) => onChange({ ...modal, date: e.target.value })}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent transition-colors"
                style={{ fontFamily: "'DM Mono', monospace" }}
                onFocus={(e) => { e.target.style.borderColor = kid.color + "60"; }}
                onBlur={(e) => { e.target.style.borderColor = "transparent"; }}
              />
            </div>

            <button
              onClick={onSave}
              disabled={!isValid}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 mt-1"
              style={{ background: kid.color, fontFamily: "'Lexend', sans-serif" }}
            >
              {isEdit ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Decorations ──────────────────────────────────────────────────────────────

function Decorations() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="absolute top-10 right-[8%] w-20 h-20 rounded-full border-4 opacity-20" style={{ borderColor: "#FF8687" }} />
      <div className="absolute top-52 left-5 w-10 h-10 rotate-45 opacity-15" style={{ background: "#FF8687" }} />
      <div className="absolute top-80 right-[4%] w-5 h-28 opacity-15 -rotate-12" style={{ background: "#282633" }} />
      <div className="absolute bottom-44 left-[10%] w-14 h-14 rounded-full opacity-15" style={{ background: "#FF8687" }} />
      <div className="absolute bottom-24 right-[18%] w-8 h-8 rotate-12 opacity-15" style={{ background: "#282633" }} />
      <div className="absolute top-[58%] left-[42%] w-5 h-5 rounded-full opacity-20" style={{ background: "#FF8687" }} />
    </div>
  );
}
