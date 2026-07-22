import { useState, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { Plus, Minus, Pencil, Trash2, X, Check, PiggyBank } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Currency = "USD" | "EUR" | "GBP" | "JPY" | "CNY";
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
  accentColor: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const SYMBOLS: Record<Currency, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
};

const ALL_CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "JPY", "CNY"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getBalance(transactions: Transaction[], currency: Currency): number {
  return transactions
    .filter((t) => t.currency === currency)
    .reduce((acc, t) => (t.type === "add" ? acc + t.amount : acc - t.amount), 0);
}

function formatAmount(amount: number, currency: Currency): string {
  const sym = SYMBOLS[currency];
  const abs = Math.abs(amount);
  if (currency === "JPY") return `${sym}${Math.round(abs).toLocaleString()}`;
  return `${sym}${abs.toFixed(2)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_KIDS: Kid[] = [
  {
    id: "kid1",
    name: "Alex",
    color: "#FF6B6B",
    accentColor: "#FFE0E0",
    transactions: [
      { id: "t1", type: "add", amount: 20, currency: "USD", description: "Weekly allowance", date: "2026-07-01" },
      { id: "t2", type: "reduce", amount: 5, currency: "USD", description: "Ice cream", date: "2026-07-08" },
      { id: "t3", type: "add", amount: 15, currency: "EUR", description: "Grandma gift", date: "2026-07-15" },
    ],
  },
  {
    id: "kid2",
    name: "Sam",
    color: "#4ECDC4",
    accentColor: "#D8F5F3",
    transactions: [
      { id: "t4", type: "add", amount: 25, currency: "USD", description: "Birthday money", date: "2026-07-03" },
      { id: "t5", type: "add", amount: 10, currency: "EUR", description: "Chores bonus", date: "2026-07-10" },
      { id: "t6", type: "reduce", amount: 8, currency: "EUR", description: "Comic books", date: "2026-07-20" },
    ],
  },
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [kids, setKids] = useState<Kid[]>(INITIAL_KIDS);
  const [currency1, setCurrency1] = useState<Currency>("USD");
  const [currency2, setCurrency2] = useState<Currency>("EUR");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingNameId) nameRef.current?.focus();
  }, [editingNameId]);

  const currencies: [Currency, Currency] = [currency1, currency2];

  // Derive used currencies for the chart
  const usedCurrencies = Array.from(
    new Set(kids.flatMap((k) => k.transactions.map((t) => t.currency)))
  ) as Currency[];

  const chartData = usedCurrencies.map((cur) => {
    const row: Record<string, number | string> = { currency: cur };
    kids.forEach((k) => {
      row[k.name] = Math.max(0, getBalance(k.transactions, cur));
    });
    return row;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openAddModal(kidId: string, type: TxType) {
    setModal({ kidId, type, amount: "", currency: currency1, description: "", date: today() });
  }

  function openEditModal(kidId: string, tx: Transaction) {
    setModal({
      kidId,
      editId: tx.id,
      type: tx.type,
      amount: String(tx.amount),
      currency: tx.currency,
      description: tx.description,
      date: tx.date,
    });
  }

  function saveModal() {
    if (!modal) return;
    const amt = parseFloat(modal.amount);
    if (isNaN(amt) || amt <= 0 || !modal.description.trim() || !modal.date) return;

    setKids((prev) =>
      prev.map((k) => {
        if (k.id !== modal.kidId) return k;
        if (modal.editId) {
          return {
            ...k,
            transactions: k.transactions.map((t) =>
              t.id === modal.editId
                ? { id: modal.editId, type: modal.type, amount: amt, currency: modal.currency, description: modal.description.trim(), date: modal.date }
                : t
            ),
          };
        }
        return {
          ...k,
          transactions: [
            ...k.transactions,
            { id: uid(), type: modal.type, amount: amt, currency: modal.currency, description: modal.description.trim(), date: modal.date },
          ],
        };
      })
    );
    setModal(null);
  }

  function deleteTx(kidId: string, txId: string) {
    setKids((prev) =>
      prev.map((k) =>
        k.id === kidId ? { ...k, transactions: k.transactions.filter((t) => t.id !== txId) } : k
      )
    );
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Lexend', sans-serif" }}>
      {/* Memphis decorative shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
        <div className="absolute top-8 right-[10%] w-20 h-20 rounded-full border-4 border-yellow-300 opacity-25" />
        <div className="absolute top-48 left-6 w-10 h-10 bg-pink-300 rotate-45 opacity-20" />
        <div className="absolute top-72 right-[5%] w-6 h-32 bg-teal-300 opacity-20 -rotate-12" />
        <div className="absolute bottom-40 left-[12%] w-14 h-14 rounded-full bg-purple-200 opacity-30" />
        <div className="absolute bottom-20 right-[20%] w-8 h-8 bg-yellow-300 rotate-12 opacity-25" />
        <div className="absolute top-[60%] left-[45%] w-4 h-4 rounded-full bg-orange-300 opacity-30" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#FF6B6B" }}>
              <PiggyBank className="text-white" size={26} />
            </div>
            <div>
              <h1
                className="text-4xl font-bold tracking-tight leading-none"
                style={{ fontFamily: "'Fredoka', sans-serif", color: "#1A1A2E" }}
              >
                PiggyBank
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                family budget tracker
              </p>
            </div>
          </div>

          {/* Currency selectors */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
              Currencies
            </span>
            <CurrencySelect value={currency1} onChange={setCurrency1} exclude={[currency2]} accentColor="#FF6B6B" />
            <CurrencySelect value={currency2} onChange={setCurrency2} exclude={[currency1]} accentColor="#4ECDC4" />
          </div>
        </header>

        {/* ── Kid Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {kids.map((kid) => (
            <KidCard
              key={kid.id}
              kid={kid}
              currencies={currencies}
              editingName={editingNameId === kid.id}
              nameInput={nameInput}
              nameRef={editingNameId === kid.id ? nameRef : undefined}
              onStartEditName={() => startEditName(kid)}
              onNameInput={setNameInput}
              onSaveName={() => saveName(kid.id)}
              onCancelName={() => setEditingNameId(null)}
              onAdd={(type) => openAddModal(kid.id, type)}
              onEdit={(tx) => openEditModal(kid.id, tx)}
              onDelete={(txId) => deleteTx(kid.id, txId)}
            />
          ))}
        </div>

        {/* ── Comparison Chart ── */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            Balance Comparison
          </h2>
          {chartData.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-12">Add transactions to see the chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={6} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,46,0.06)" vertical={false} />
                <XAxis
                  dataKey="currency"
                  tick={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fill: "#7A7A8C" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fill: "#7A7A8C" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  cursor={{ fill: "rgba(26,26,46,0.04)" }}
                  contentStyle={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(26,26,46,0.1)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  formatter={(val: number) => [`${val.toFixed(2)}`, ""]}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "'Lexend', sans-serif", fontSize: 13, paddingTop: 16 }}
                />
                {kids.map((kid) => (
                  <Bar key={kid.id} dataKey={kid.name} fill={kid.color} radius={[8, 8, 0, 0]} maxBarSize={72} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modal && (
        <TransactionModal
          modal={modal}
          currencies={currencies}
          kids={kids}
          onChange={setModal}
          onSave={saveModal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ─── KidCard ─────────────────────────────────────────────────────────────────

interface KidCardProps {
  kid: Kid;
  currencies: [Currency, Currency];
  editingName: boolean;
  nameInput: string;
  nameRef?: React.RefObject<HTMLInputElement | null>;
  onStartEditName: () => void;
  onNameInput: (v: string) => void;
  onSaveName: () => void;
  onCancelName: () => void;
  onAdd: (type: TxType) => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (txId: string) => void;
}

function KidCard({
  kid, currencies, editingName, nameInput, nameRef,
  onStartEditName, onNameInput, onSaveName, onCancelName,
  onAdd, onEdit, onDelete,
}: KidCardProps) {
  const sorted = [...kid.transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      {/* Card header strip */}
      <div className="h-2 w-full" style={{ background: kid.color }} />

      <div className="p-5 flex flex-col gap-5 flex-1">
        {/* Name row */}
        <div className="flex items-center justify-between">
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
              <button onClick={onSaveName} className="p-1 rounded-full hover:bg-muted transition-colors" aria-label="Save name">
                <Check size={16} style={{ color: kid.color }} />
              </button>
              <button onClick={onCancelName} className="p-1 rounded-full hover:bg-muted transition-colors" aria-label="Cancel">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={onStartEditName}
              className="text-2xl font-bold hover:opacity-70 transition-opacity text-left flex items-center gap-1.5 group"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
              aria-label={`Edit name: ${kid.name}`}
            >
              {kid.name}
              <Pencil size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Add/Reduce buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onAdd("add")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white transition-all hover:scale-105 active:scale-95"
              style={{ background: kid.color, fontFamily: "'Lexend', sans-serif" }}
            >
              <Plus size={14} /> Add
            </button>
            <button
              onClick={() => onAdd("reduce")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 border"
              style={{ color: kid.color, borderColor: kid.color, background: kid.accentColor, fontFamily: "'Lexend', sans-serif" }}
            >
              <Minus size={14} /> Spend
            </button>
          </div>
        </div>

        {/* Balances */}
        <div className="flex gap-3">
          {currencies.map((cur) => {
            const bal = getBalance(kid.transactions, cur);
            return (
              <div
                key={cur}
                className="flex-1 rounded-xl px-4 py-3"
                style={{ background: kid.accentColor }}
              >
                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {cur}
                </div>
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{ fontFamily: "'DM Mono', monospace", color: bal < 0 ? "#FF4444" : kid.color }}
                >
                  {bal < 0 ? "−" : ""}{formatAmount(Math.abs(bal), cur)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transactions */}
        <div className="flex flex-col gap-1 flex-1">
          <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
            Transactions
          </div>
          {sorted.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-6">No transactions yet.</p>
          )}
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: `${kid.color}33 transparent` }}>
            {sorted.map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                kidColor={kid.color}
                onEdit={() => onEdit(tx)}
                onDelete={() => onDelete(tx.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TxRow ────────────────────────────────────────────────────────────────────

function TxRow({ tx, kidColor, onEdit, onDelete }: {
  tx: Transaction;
  kidColor: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isAdd = tx.type === "add";
  return (
    <div className="flex items-center gap-2 group px-3 py-2 rounded-xl hover:bg-muted transition-colors">
      {/* Type indicator */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: isAdd ? kidColor : "#FF4444", opacity: 0.9 }}
      >
        {isAdd ? <Plus size={11} /> : <Minus size={11} />}
      </div>

      {/* Description + date */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ fontFamily: "'Lexend', sans-serif" }}>
          {tx.description}
        </div>
        <div className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
          {tx.date}
        </div>
      </div>

      {/* Amount */}
      <div
        className="text-sm font-semibold tabular-nums flex-shrink-0"
        style={{ fontFamily: "'DM Mono', monospace", color: isAdd ? kidColor : "#FF4444" }}
      >
        {isAdd ? "+" : "−"}{formatAmount(tx.amount, tx.currency)} {tx.currency}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-background transition-colors"
          aria-label="Edit transaction"
        >
          <Pencil size={13} className="text-muted-foreground" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          aria-label="Delete transaction"
        >
          <Trash2 size={13} className="text-destructive" />
        </button>
      </div>
    </div>
  );
}

// ─── TransactionModal ─────────────────────────────────────────────────────────

function TransactionModal({ modal, currencies, kids, onChange, onSave, onClose }: {
  modal: ModalState;
  currencies: [Currency, Currency];
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
      style={{ background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Modal header */}
        <div className="h-1.5 w-full" style={{ background: kid.color }} />
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-xl font-bold"
              style={{ fontFamily: "'Fredoka', sans-serif" }}
            >
              {isEdit ? "Edit Transaction" : modal.type === "add" ? `Add Money — ${kid.name}` : `Spend Money — ${kid.name}`}
            </h3>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Type toggle (only when adding) */}
            {!isEdit && (
              <div className="flex rounded-xl overflow-hidden border border-border">
                {(["add", "reduce"] as TxType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => onChange({ ...modal, type: t })}
                    className="flex-1 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      fontFamily: "'Lexend', sans-serif",
                      background: modal.type === t ? kid.color : "transparent",
                      color: modal.type === t ? "#fff" : "#7A7A8C",
                    }}
                  >
                    {t === "add" ? "Add Money" : "Spend"}
                  </button>
                ))}
              </div>
            )}

            {/* Amount + Currency */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={modal.amount}
                  onChange={(e) => onChange({ ...modal, amount: e.target.value })}
                  className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 transition-all"
                  style={{ fontFamily: "'DM Mono', monospace", ringColor: kid.color }}
                  onFocus={(e) => { e.target.style.outline = `2px solid ${kid.color}40`; e.target.style.outlineOffset = "0px"; }}
                  onBlur={(e) => { e.target.style.outline = "none"; }}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Currency
                </label>
                <select
                  value={modal.currency}
                  onChange={(e) => onChange({ ...modal, currency: e.target.value as Currency })}
                  className="bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none h-[42px] cursor-pointer"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {currencies.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Description
              </label>
              <input
                type="text"
                placeholder="What is this for?"
                value={modal.description}
                onChange={(e) => onChange({ ...modal, description: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && isValid) onSave(); }}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{ fontFamily: "'Lexend', sans-serif" }}
                onFocus={(e) => { e.target.style.outline = `2px solid ${kid.color}40`; e.target.style.outlineOffset = "0px"; }}
                onBlur={(e) => { e.target.style.outline = "none"; }}
                maxLength={60}
              />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 uppercase tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
                Date
              </label>
              <input
                type="date"
                value={modal.date}
                onChange={(e) => onChange({ ...modal, date: e.target.value })}
                className="w-full bg-input-background rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                style={{ fontFamily: "'DM Mono', monospace" }}
                onFocus={(e) => { e.target.style.outline = `2px solid ${kid.color}40`; e.target.style.outlineOffset = "0px"; }}
                onBlur={(e) => { e.target.style.outline = "none"; }}
              />
            </div>

            {/* Save */}
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

// ─── CurrencySelect ───────────────────────────────────────────────────────────

function CurrencySelect({ value, onChange, exclude, accentColor }: {
  value: Currency;
  onChange: (c: Currency) => void;
  exclude: Currency[];
  accentColor: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Currency)}
      className="bg-card border border-border rounded-xl px-3 py-2 text-sm font-medium cursor-pointer outline-none hover:border-current transition-colors"
      style={{ fontFamily: "'DM Mono', monospace", color: accentColor }}
    >
      {ALL_CURRENCIES.filter((c) => !exclude.includes(c) || c === value).map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
