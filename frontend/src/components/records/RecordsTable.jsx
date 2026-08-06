import { useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  getMedicalRecords,
  deleteMedicalRecord,
} from "../../services/elderRecordsService";

const CATEGORIES = ["", "Vitals", "Diagnosis", "Allergy", "Checkup", "Medication", "General"];

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const statusStyle = {
  Active: "bg-emerald-100 text-emerald-800",
  Resolved: "bg-sky-100 text-sky-800",
  Monitoring: "bg-accent-soft text-primary-dark",
  Critical: "bg-rose-soft text-rose",
};

export default function RecordsTable({ elderId, token, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("recordedAt");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await getMedicalRecords(elderId, token, {
          search,
          category,
          from,
          to,
          sort,
          order,
          page,
          limit: 8,
        });
        setItems(res.data.items);
        setPages(res.data.pages);
        setTotal(res.data.total);
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not load records");
      } finally {
        setLoading(false);
      }
    }, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [elderId, token, search, category, from, to, sort, order, page, refreshKey]);

  const toggleSort = (field) => {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(field);
      setOrder("desc");
    }
  };

  const handleDelete = async (recordId) => {
    try {
      await deleteMedicalRecord(elderId, recordId, token);
      toast.success("Record deleted");
      const res = await getMedicalRecords(elderId, token, {
        search,
        category,
        from,
        to,
        sort,
        order,
        page: 1,
        limit: 8,
      });
      setPage(1);
      setItems(res.data.items);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-paper-card shadow-sm">
      <div className="border-b border-border px-5 py-4">
        <h3 className="font-display text-lg font-semibold text-ink">
          Medical records
        </h3>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search records..."
              className="w-full rounded-lg border border-border bg-paper py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-paper px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              {CATEGORIES.filter(Boolean).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-paper px-3 py-2 font-mono text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-border bg-paper px-3 py-2 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-paper" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-soft">
            No records match your filters.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-paper text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                {[
                  ["recordedAt", "Date"],
                  ["category", "Category"],
                  [null, "Updated By"],
                  ["title", "Description"],
                  ["status", "Status"],
                  [null, "Actions"],
                ].map(([field, label]) => (
                  <th key={label} className="px-4 py-3 font-semibold">
                    {field ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(field)}
                        className="hover:text-ink"
                      >
                        {label}
                        {sort === field ? (order === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row._id} className="border-t border-border hover:bg-paper/50">
                  <td className="px-4 py-3 font-mono text-xs">
                    {formatDate(row.recordedAt)}
                  </td>
                  <td className="px-4 py-3">{row.category}</td>
                  <td className="px-4 py-3">{row.updatedBy?.name || "—"}</td>
                  <td className="max-w-[220px] px-4 py-3">
                    <p className="font-medium text-ink">{row.title}</p>
                    {row.description && (
                      <p className="truncate text-xs text-ink-soft">
                        {row.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusStyle[row.status] || "bg-paper text-ink-soft"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleDelete(row._id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-rose hover:bg-rose-soft"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-ink-soft">
        <span>
          {total} record{total === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
