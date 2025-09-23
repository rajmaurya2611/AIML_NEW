import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Input, Button, Space, message, Tooltip, Modal } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Save, RotateCcw, Download, RefreshCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type ApiRow = Record<string, any>;
const API_BASE = import.meta.env.VITE_CAPEX_BASE_URL || "";

// ----- helpers -----
function isMonthCol(name: string) {
  return /^(January|February|March|April|May|June|July|August|September|October|November|December)\s20\d{2}$/i.test(name);
}
function isFYCol(name: string) {
  return /^FY\s+\d{4}-\d{2}$/i.test(name);
}
function isFlagCol(name: string) {
  return /_flag$/i.test(name);
}
function isCommodityLevel(name: string) {
  return /^Purchasing Commodity L[1-6]$/i.test(name);
}
function numericAlign(name: string): "left" | "right" {
  return isMonthCol(name) || isFYCol(name) ? "right" : "left";
}
function widthFor(name: string): number {
  if (name === "__rowid__") return 90;
  if (name.toLowerCase() === "id") return 110;
  if (name === "Company") return 140;
  if (name === "Plant") return 260;
  if (name === "Organisation Cost Center") return 220;
  if (name === "MPP L1" || name === "MPP L2") return 220;

  if (isCommodityLevel(name)) {
    const lvl = parseInt(name.replace(/\D/g, ""), 10);
    if (lvl === 1 || lvl === 2) return 220;
    if (lvl === 3 || lvl === 4) return 200;
    return 180;
  }

  if (isMonthCol(name)) return 130;
  if (isFYCol(name)) return 140;
  if (isFlagCol(name)) return 180;
  if (/^Purchasing/i.test(name)) return 200;

  return 160;
}

export default function DataViewerPage() {
  const [searchParams] = useSearchParams();
  const tableParam = searchParams.get("table") || "";
  const [tableName] = useState(tableParam);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [originalRows, setOriginalRows] = useState<ApiRow[]>([]);
  const [columnsOrder, setColumnsOrder] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  // ------- HEADER FILTER STATE (frontend) -------
  const FILTER_COLS = [
    "Purchasing Commodity L1",
    "Purchasing Commodity L2",
    "Purchasing Commodity L3",
    "Purchasing Commodity L4",
    "Purchasing Commodity L5",
    "Purchasing Commodity L6",
    "MPP L1",
    "MPP L2",
  ] as const;
  type FilterKey = (typeof FILTER_COLS)[number];

  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    "Purchasing Commodity L1": "",
    "Purchasing Commodity L2": "",
    "Purchasing Commodity L3": "",
    "Purchasing Commodity L4": "",
    "Purchasing Commodity L5": "",
    "Purchasing Commodity L6": "",
    "MPP L1": "",
    "MPP L2": "",
  });

  const handleFilterChange = (key: FilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      "Purchasing Commodity L1": "",
      "Purchasing Commodity L2": "",
      "Purchasing Commodity L3": "",
      "Purchasing Commodity L4": "",
      "Purchasing Commodity L5": "",
      "Purchasing Commodity L6": "",
      "MPP L1": "",
      "MPP L2": "",
    });
  };
  // ---------------------------------------------

  useEffect(() => {
    if (!tableName) {
      message.warning("Missing ?table=... in URL");
      return;
    }
    fetchData(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, page, pageSize]);

  const fetchData = useCallback(
    async (pageNum: number, pageSz: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(pageSz));
        params.set("offset", String((pageNum - 1) * pageSz));
        // No order_by / order_dir — show data as-is

        const url = `${API_BASE}/db/${encodeURIComponent(tableName)}/all?` + params.toString();
        const res = await fetch(url);
        const data = await res.json().catch(() => {
          throw new Error("Invalid JSON from server");
        });

        if (data.status !== "success") throw new Error(data.message || "Failed to load data");

        setRows(data.rows || []);
        setOriginalRows(data.rows || []);
        setTotal(data.total || 0);
        setColumnsOrder(Array.isArray(data.columns) ? data.columns : Object.keys(data.rows?.[0] || {}));
      } catch (e: any) {
        const msg = e?.message || "Failed to load data";
        setError(msg);
        message.error(msg);
        setRows([]);
        setOriginalRows([]);
        setTotal(0);
        setColumnsOrder([]);
      } finally {
        setLoading(false);
      }
    },
    [tableName]
  );

  // Stable row key
  const rowKey = (r: ApiRow) =>
    r.__rowid__ ?? r.ID ?? r.Id ?? r.id ?? `${r.Company}-${r.Plant}-${r.ID}`;

  // Apply client-side filters to the current page’s dataset
  const filteredRows = useMemo(() => {
    const active = Object.entries(filters).filter(([, v]) => (v ?? "").trim().length > 0) as [FilterKey, string][];
    if (active.length === 0) return rows;
    return rows.filter((row) => {
      for (const [col, q] of active) {
        const cell = row[col];
        const s = cell == null ? "" : String(cell);
        if (!s.toLowerCase().includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters]);

  // Editing by row key (safe under filtering)
  const setCell = (recordKey: string, col: "MPP L1" | "MPP L2", value: string) => {
    setRows((prev) => {
      const idx = prev.findIndex((r) => rowKey(r) === recordKey);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], [col]: value };
      return next;
    });
  };

  // Track changed rows vs original (by index)
  const changedRows = useMemo(() => {
    const out: ApiRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const before = originalRows[i] ?? {};
      const after = rows[i] ?? {};
      const delta: ApiRow = {};
      let changed = false;
      (["MPP L1", "MPP L2"] as const).forEach((col) => {
        if (before[col] !== after[col]) {
          delta[col] = after[col];
          changed = true;
        }
      });
      if (changed) {
        if (after.__rowid__ != null) delta.__rowid__ = after.__rowid__;
        else if (after.ID != null) delta.ID = after.ID;
        out.push(delta);
      }
    }
    return out;
  }, [rows, originalRows]);

  const saveChanges = async () => {
    if (changedRows.length === 0) {
      message.info("No changes to save.");
      return;
    }

    Modal.confirm({
      title: "Are you sure you want to save changes?",
      content: "Doing this will update the Database and cannot be undone.",
      okText: "Yes, Save",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await fetch(`${API_BASE}/db/${encodeURIComponent(tableName)}/update-mpp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: changedRows }),
          });
          const data = await res.json();
          if (data.status === "success" || data.status === "partial_success") {
            message.success(`Updated ${data.updated} row(s).`);
            fetchData(page, pageSize);
          } else {
            throw new Error(data.message || "Update failed");
          }
        } catch (e: any) {
          message.error(e?.message || "Update failed");
        }
      },
    });
  };

  const resetChanges = () => {
    setRows(originalRows);
    message.success("Reverted unsaved edits.");
  };

  // Pagination only (sorting disabled)
  const onTableChange = (pagination: TablePaginationConfig) => {
    const current = pagination.current || 1;
    const size = pagination.pageSize || pageSize;
    setPage(current);
    setPageSize(size);
  };

  const totalScrollX = useMemo(
    () => columnsOrder.reduce((sum, name) => sum + widthFor(name), 0) + 200,
    [columnsOrder]
  );

  // Build columns; inject header filter inputs for target columns
  const columns: ColumnsType<ApiRow> = useMemo(() => {
    const order = columnsOrder.filter(Boolean);

    const headerWithFilter = (label: FilterKey) => (
      <div className="flex flex-col gap-1">
        <span>{label}</span>
        <Input
          allowClear
          size="small"
          placeholder="Search…"
          value={filters[label]}
          onChange={(e) => handleFilterChange(label, e.target.value)}
        />
      </div>
    );

    const buildEditable = (dataIndex: "MPP L1" | "MPP L2") => ({
      title: headerWithFilter(dataIndex),
      dataIndex,
      key: dataIndex,
      align: "left" as const,
      width: widthFor(dataIndex),
      render: (_: any, record: ApiRow) => {
        const k = rowKey(record);
        return (
          <Input
            size="small"
            value={record?.[dataIndex] ?? ""}
            onChange={(e) => setCell(k, dataIndex, e.target.value)}
            className="font-mono"
          />
        );
      },
    });

    return order.map((name) => {
      // Editable with header filter for MPP L1/L2
      if (name === "MPP L1" || name === "MPP L2") return buildEditable(name);

      // Header filter for commodity L1-L6
      if (
        name === "Purchasing Commodity L1" ||
        name === "Purchasing Commodity L2" ||
        name === "Purchasing Commodity L3" ||
        name === "Purchasing Commodity L4" ||
        name === "Purchasing Commodity L5" ||
        name === "Purchasing Commodity L6"
      ) {
        return {
          title: headerWithFilter(name as FilterKey),
          dataIndex: name,
          key: name,
          width: widthFor(name),
          align: numericAlign(name),
          ellipsis: true,
          render: (val: any) => (val == null ? "" : String(val)),
        } as any;
      }

      // Default column (no header filter)
      return {
        title: name,
        dataIndex: name,
        key: name,
        width: widthFor(name),
        align: numericAlign(name),
        ellipsis: true,
        render: (val: any) => {
          if (val === null || val === undefined) return "";
          if (isFlagCol(name)) {
            const v = String(val).trim();
            const yes = v === "1" || /^(true|yes)$/i.test(v);
            return (
              <span
                className={`px-2 py-0.5 rounded text-xs ${
                  yes ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                }`}
              >
                {yes ? "Yes" : "No"}
              </span>
            );
          }
          if (isMonthCol(name) || isFYCol(name)) {
            const num = Number(val);
            if (!Number.isNaN(num)) {
              return <span className="font-mono">{num.toLocaleString(undefined, { maximumFractionDigits: 3 })}</span>;
            }
          }
          return String(val);
        },
      } as any;
    });
  }, [columnsOrder, filters]); // re-render headers when filters change

  const downloadCsv = () => {
    const url = `${API_BASE}/db/${encodeURIComponent(tableName)}/all?csv=true`;
    window.open(url, "_blank");
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center py-3">
        <div className="flex items-center gap-2">
          <Tooltip title="Reload">
            <Button
              type="default"
              icon={<RefreshCcw size={16} />}
              onClick={() => fetchData(page, pageSize)}
            />
          </Tooltip>
          <span className="text-sm text-gray-600">
            Table: <b>{tableName}</b> · Rows: {filteredRows.length}/{total}
          </span>
        </div>
        <Space>
          <Button icon={<Download size={16} />} onClick={downloadCsv}>
            Export CSV
          </Button>
          <Button onClick={clearAllFilters}>Clear column filters</Button>
          <Button icon={<RotateCcw size={16} />} onClick={resetChanges}>
            Reset
          </Button>
          <Button
            type="primary"
            icon={<Save size={16} />}
            onClick={saveChanges}
            disabled={changedRows.length === 0}
          >
            Save MPP L1/L2
          </Button>
        </Space>
      </div>

      <Table<ApiRow>
        dataSource={filteredRows}
        columns={columns}
        loading={loading}
        rowKey={rowKey}
        pagination={{
          current: page,
          pageSize,
          total: total,                    // ✅ FIX: use backend total, not filteredRows.length
          showSizeChanger: true,
          pageSizeOptions: [25, 50, 100, 200],
        }}
        scroll={{ x: totalScrollX }}
        onChange={onTableChange}
        bordered
        size="small"
      />

      {error && <div className="mt-3 text-red-600 text-sm font-mono">{error}</div>}
    </div>
  );
}
