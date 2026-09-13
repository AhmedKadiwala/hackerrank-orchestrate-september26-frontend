import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertCircle, CalendarDays, CheckCircle2, CreditCard, Loader2, WalletCards } from "lucide-react";
import "./styles.css";

type RequestRow = {
  request_id: string;
  user_id: string;
  request_date: string;
  request_type: string;
  requested_amount: string;
  desired_completion_date: string;
  allows_partial_payment: string;
  request_text: string;
};

type Analysis = {
  request_id: string;
  amount_safe_to_pay: string;
  affordability_status: string;
  recommended_payment_method: string;
  payment_plan: string;
  earliest_date_for_full_payment: string;
  spending_changes_needed: string;
  decision_explanation: string;
  forecast_summary?: Record<string, string>;
  evidence_summary?: Array<Record<string, string>>;
};

type Health = {
  ok: boolean;
  requests: number;
  db?: Record<string, number | boolean>;
};

const DEFAULT_API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "https://hackerrank-orchestrate-september26.onrender.com";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init);
  if (!response.ok) {
    let detail = `API ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || body.error || detail;
    } catch {
      // Keep the status-only fallback for non-JSON failures.
    }
    throw new Error(detail);
  }
  return response.json();
}

function App() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [selected, setSelected] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson<Health>("/api/health")
      .then(setHealth)
      .catch((e) => setError(String(e)));
    apiJson<RequestRow[]>("/api/requests")
      .then((rows) => {
        setRequests(rows);
        setSelected(rows[0]?.request_id ?? "");
      })
      .catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError("");
    apiJson<Analysis>(`/api/analyze/${selected}`, { method: "POST" })
      .then(setAnalysis)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [selected]);

  const request = useMemo(() => requests.find((r) => r.request_id === selected), [requests, selected]);
  const payments = analysis?.payment_plan === "none" ? [] : analysis?.payment_plan.split("|") ?? [];
  const badgeClass = analysis?.affordability_status ?? "loading";

  return (
    <main>
      <aside>
        <div className="brand"><WalletCards size={22} /> Buy or Wait</div>
        <div className="api-status">
          <span>{health?.ok ? "API connected" : "API pending"}</span>
          <small>{API_BASE}</small>
        </div>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          {requests.map((r) => <option key={r.request_id}>{r.request_id}</option>)}
        </select>
        {request && (
          <section className="plain">
            <h2>{request.request_type.replace("_", " ")}</h2>
            <p>{request.request_text}</p>
            <dl>
              <dt>Amount</dt><dd>{request.requested_amount}</dd>
              <dt>Deadline</dt><dd>{request.desired_completion_date}</dd>
              <dt>Partial</dt><dd>{request.allows_partial_payment}</dd>
            </dl>
          </section>
        )}
      </aside>
      <section className="content">
        {loading && <div className="notice"><Loader2 className="spin" /> Analyzing request</div>}
        {error && <div className="notice error"><AlertCircle /> {error}</div>}
        {analysis && (
          <>
            <div className={`decision ${badgeClass}`}>
              <CheckCircle2 />
              <div>
                <span>Decision</span>
                <strong>{analysis.affordability_status.replace(/_/g, " ").toUpperCase()}</strong>
              </div>
            </div>
            <div className="grid">
              <section>
                <h3>Financial Snapshot</h3>
                <p className="metric">{analysis.amount_safe_to_pay}</p>
                <span>safe to pay today</span>
              </section>
              <section>
                <h3>Recommended Method</h3>
                <p className="metric">{analysis.recommended_payment_method.replace("_", " ")}</p>
                <span>selected by deterministic ranking</span>
              </section>
              <section>
                <h3>Earliest Full Payment</h3>
                <p className="metric">{analysis.earliest_date_for_full_payment || "none"}</p>
                <span>without optional cuts</span>
              </section>
            </div>
            <section>
              <h3><CalendarDays size={18} /> Payment Timeline</h3>
              <div className="timeline">
                {payments.length ? payments.map((p) => {
                  const [d, a] = p.split(":");
                  return <div className="payment" key={p}><b>{d}</b><span>{a}</span></div>;
                }) : <span>No payment recommended</span>}
              </div>
            </section>
            <section>
              <h3><CreditCard size={18} /> Spending Changes</h3>
              <p>{analysis.spending_changes_needed}</p>
            </section>
            <section>
              <h3>Explanation</h3>
              <p>{analysis.decision_explanation}</p>
            </section>
          </>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
