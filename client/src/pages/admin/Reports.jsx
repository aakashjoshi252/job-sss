import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { BarChart3, Download, FileSpreadsheet, FileText, Save } from "lucide-react";
import { adminApi } from "../../api/api";

const statusLabel = (item) => item._id || item.status || "Unknown";

const downloadBlob = (content, fileName, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export default function Reports() {
  const [period, setPeriod] = useState("30");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await adminApi.get("/reports/overview", { params: { period } });
      setReport(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const conversionRows = useMemo(() => report?.charts?.applicationConversion || [], [report]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Total jobs", report.totals.jobs],
      ["Applications", report.totals.applications],
      ["Candidates", report.totals.candidates],
      ["Recruiters", report.totals.recruiters],
      ["Shortlisted", report.totals.shortlisted],
      ["Hiring outcomes", report.totals.hired],
      ["Subscription revenue", report.totals.subscriptionRevenue],
      ["Monthly subscription revenue", report.totals.monthlyRecurringRevenue],
      ["Active subscriptions", report.totals.activeSubscriptions],
      ["Expired subscriptions", report.totals.expiredSubscriptions],
      [],
      ["Application status", "Count"],
      ...conversionRows.map((item) => [statusLabel(item), item.count]),
    ];
    downloadBlob(
      rows.map((row) => row.map(csvCell).join(",")).join("\n"),
      `admin-report-${report.periodDays}-days.csv`,
      "text/csv;charset=utf-8"
    );
  };

  const exportExcel = () => {
    if (!report) return;
    const rows = conversionRows
      .map((item) => `<tr><td>${statusLabel(item)}</td><td>${item.count}</td></tr>`)
      .join("");
    downloadBlob(
      `<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Total jobs</td><td>${report.totals.jobs}</td></tr><tr><td>Applications</td><td>${report.totals.applications}</td></tr></table><br/><table><tr><th>Application status</th><th>Count</th></tr>${rows}</table>`,
      `admin-report-${report.periodDays}-days.xls`,
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  const exportPdf = async () => {
    if (!reportRef.current) return;

    try {
      const { default: html2pdf } = await import("html2pdf.js");
      await html2pdf()
        .set({
          filename: `admin-report-${report.periodDays}-days.pdf`,
          margin: 10,
          html2canvas: { scale: 2 },
          jsPDF: { format: "a4", orientation: "portrait" },
        })
        .from(reportRef.current)
        .save();
    } catch (error) {
      toast.error(error.message || "Unable to export PDF");
    }
  };

  const saveSnapshot = async () => {
    try {
      await adminApi.post("/reports/snapshots", { period });
      toast.success("Report snapshot saved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save report snapshot");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Generative Reports</h1>
          <p className="mt-2 text-gray-600">Admin reporting, conversion tracking, and export-ready snapshots.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 365 days</option>
          </select>
          <ExportButton icon={<Download />} label="CSV" onClick={exportCsv} />
          <ExportButton icon={<FileSpreadsheet />} label="Excel" onClick={exportExcel} />
          <ExportButton icon={<FileText />} label="PDF" onClick={exportPdf} />
          <ExportButton icon={<Save />} label="Snapshot" onClick={saveSnapshot} />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-80 items-center justify-center rounded-lg bg-white shadow-md">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : report ? (
        <div ref={reportRef} className="space-y-6 rounded-xl bg-gray-50">
          <section className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-blue-700">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase">Generated summary</span>
            </div>
            <p className="text-lg leading-8 text-gray-800">{report.summary}</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <Metric label="Jobs" value={report.totals.jobs} />
            <Metric label="Applications" value={report.totals.applications} delta={report.growth.applications} />
            <Metric label="Candidates" value={report.totals.candidates} delta={report.growth.candidates} />
            <Metric label="Recruiters" value={report.totals.recruiters} delta={report.growth.recruiters} />
            <Metric label="Shortlisted" value={report.totals.shortlisted} />
            <Metric label="Hiring Outcomes" value={report.totals.hired} />
            <Metric label="Sub. Revenue" value={`INR ${Number(report.totals.subscriptionRevenue || 0).toLocaleString("en-IN")}`} />
            <Metric label="Active Subs" value={report.totals.activeSubscriptions} />
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Application Conversion">
              <BarRows rows={conversionRows.map((item) => ({ label: statusLabel(item), value: item.count }))} />
            </ChartPanel>
            <ChartPanel title="Top Job Professions">
              <BarRows rows={(report.charts.topProfessions || []).map((item) => ({ label: item.profession, value: item.applications }))} />
            </ChartPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Monthly Growth">
              <BarRows rows={(report.charts.monthlyGrowth || []).map((item) => ({ label: item.month, value: item.users }))} />
            </ChartPanel>
            <ChartPanel title="Plan-wise Subscribers">
              <BarRows rows={(report.charts.planWiseSubscribers || []).map((item) => ({ label: item.planName, value: item.subscribers }))} />
            </ChartPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ChartPanel title="Recruiter Job Post Usage">
              <BarRows rows={(report.charts.recruiterJobPostUsage || []).map((item) => ({ label: item.recruiterName, value: item.jobsPosted }))} />
            </ChartPanel>
            <ChartPanel title="Recruiter Performance">
              <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full text-left text-sm">
                  <thead className="text-xs uppercase text-gray-500">
                    <tr>
                      <th className="pb-3">Recruiter</th>
                      <th className="pb-3">Applications</th>
                      <th className="pb-3">Hires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(report.recruiterPerformance || []).map((item) => (
                      <tr key={item.recruiterId}>
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{item.recruiterName}</p>
                          <p className="text-xs text-gray-500">{item.recruiterEmail}</p>
                        </td>
                        <td className="py-3">{item.applications}</td>
                        <td className="py-3">{item.hires}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartPanel>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ExportButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-700"
    >
      <span className="h-4 w-4">{icon}</span>
      {label}
    </button>
  );
}

function Metric({ label, value, delta }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value || 0}</p>
      {delta !== undefined && (
        <p className={`mt-2 text-sm font-semibold ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
          {delta >= 0 ? "+" : ""}{delta}% vs prior period
        </p>
      )}
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 text-lg font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function BarRows({ rows }) {
  const max = Math.max(...rows.map((row) => row.value || 0), 1);

  if (!rows.length) {
    return <p className="text-sm text-gray-500">No data in this period.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-gray-700">{row.label}</span>
            <span className="font-semibold text-gray-900">{row.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-blue-600"
              style={{ width: `${Math.max((row.value / max) * 100, row.value ? 8 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
