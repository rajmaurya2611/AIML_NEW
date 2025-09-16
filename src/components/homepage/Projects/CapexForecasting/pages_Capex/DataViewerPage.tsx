import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Input, Button, Space, message, Tooltip, Modal } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Save, RotateCcw, Download, RefreshCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

type ApiRow = Record<string, any>;
const API_BASE = import.meta.env.VITE_CAPEX_BASE_URL || "";

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
        // NO order_by / order_dir — show data “as is”

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

  const setCell = (rowIndex: number, col: "MPP L1" | "MPP L2", value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], [col]: value };
      return next;
    });
  };

  const changedRows = useMemo(() => {
    const out: ApiRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const before = originalRows[i] || {};
      const after = rows[i] || {};
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

  // Only react to pagination — ignore sorter completely
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

  const columns: ColumnsType<ApiRow> = useMemo(() => {
    const order = columnsOrder.filter(Boolean);

    const buildEditable = (dataIndex: "MPP L1" | "MPP L2") => ({
      title: dataIndex,
      dataIndex,
      key: dataIndex,
      align: "left" as const,
      width: widthFor(dataIndex),
      // sorter removed
      render: (_: any, __: ApiRow, idx: number) => (
        <Input
          size="small"
          value={rows[idx]?.[dataIndex] ?? ""}
          onChange={(e) => setCell(idx, dataIndex, e.target.value)}
          className="font-mono"
        />
      ),
    });

    return order.map((name) => {
      if (name === "MPP L1" || name === "MPP L2") return buildEditable(name);
      return {
        title: name,
        dataIndex: name,
        key: name,
        width: widthFor(name),
        align: numericAlign(name),
        ellipsis: true,
        // sorter removed everywhere
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
  }, [columnsOrder, rows]);

  const rowKey = (r: ApiRow) =>
    r.__rowid__ ?? r.ID ?? r.Id ?? r.id ?? `${r.Company}-${r.Plant}-${r.ID}`;

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
            Table: <b>{tableName}</b> &middot; Rows: {rows.length}/{total}
          </span>
        </div>
        <Space>
          <Button icon={<Download size={16} />} onClick={downloadCsv}>
            Export CSV
          </Button>
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
        dataSource={rows}
        columns={columns}
        loading={loading}
        rowKey={rowKey}
        pagination={{
          current: page,
          pageSize,
          total,
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
