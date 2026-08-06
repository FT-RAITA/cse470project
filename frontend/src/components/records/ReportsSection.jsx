import { Download, Eye, Trash2, FileText } from "lucide-react";
import toast from "react-hot-toast";
import {
  deleteReport,
  reportFileUrl,
} from "../../services/elderRecordsService";

function formatSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReportsSection({ reports = [], elderId, token, onChanged }) {
  const handleDelete = async (reportId) => {
    try {
      await deleteReport(elderId, reportId, token);
      toast.success("Report deleted");
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete report");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-paper-card p-5 shadow-sm">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">
        Medical reports
      </h3>

      {reports.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-paper px-4 py-10 text-center text-sm text-ink-soft">
          No reports uploaded yet. Use “Upload Report” to add prescriptions or scans.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reports.map((r) => {
            const url = reportFileUrl(r.fileName);
            const isImage = (r.mimeType || "").startsWith("image/");
            return (
              <div
                key={r._id}
                className="flex flex-col rounded-xl border border-border bg-paper p-4 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{r.title}</p>
                    <p className="text-xs text-ink-soft">
                      {r.reportType} · {formatSize(r.size)}
                    </p>
                  </div>
                </div>

                {isImage && (
                  <img
                    src={url}
                    alt={r.title}
                    className="mb-3 h-28 w-full rounded-lg object-cover border border-border"
                  />
                )}

                <div className="mt-auto flex flex-wrap gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper-card"
                  >
                    <Eye size={13} />
                    Preview
                  </a>
                  <a
                    href={url}
                    download={r.originalName || r.fileName}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper-card"
                  >
                    <Download size={13} />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(r._id)}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold text-rose hover:bg-rose-soft"
                  >
                    <Trash2 size={13} />
                    Delete
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
