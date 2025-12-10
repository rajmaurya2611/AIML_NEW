import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Space, message, Tooltip, Input } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Download, RefreshCcw, Save, RotateCcw } from "lucide-react";

type Row = Record<string, any>;
const API_BASE = import.meta.env.VITE_CAPEX_BASE_URL || "";

export default function CommodityTranslationViewer() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<Row[]>([]);
    const [columnsOrder, setColumnsOrder] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState(200);
    const [page, setPage] = useState(1);

    // edits map: stableKey -> partial edits (we only care about "Offset Months")
    const [edits, setEdits] = useState<Map<string, Partial<Row>>>(new Map());

    // Search text
    const [search, setSearch] = useState("");

    const assignStableKeys = (arr: Row[]) =>
        arr.map((r, i) => ({
            ...r,
            __key: `${r["Commodity Name"] || r["Commodity"] || "row"}_${i}`,
        }));

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/get_commodity_translation`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
            const data = await res.json().catch(() => {
                throw new Error("Invalid JSON");
            });

            const fetched = Array.isArray(data) ? data : [];
            const withKeys = assignStableKeys(fetched);
            setRows(withKeys);

            setColumnsOrder(
                fetched.length > 0
                    ? Object.keys(fetched[0])
                    : ["Commodity Name", "MPP L1 Commodity", "MPP L2 Commodity", "Offset Months"]
            );

            setEdits(new Map());
        } catch (e: any) {
            console.error("Fetch commodity translation error:", e);
            setError(e?.message || "Failed to load data");
            message.error(e?.message || "Failed to load data");
            setRows([]);
            setColumnsOrder([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const rowKey = (r: Row) => r.__key;

    const updateCell = (key: string, col: string, value: any) => {
        setEdits((prev) => {
            const next = new Map(prev);
            const existing = next.get(key) ?? {};
            next.set(key, { ...existing, [col]: value });
            return next;
        });
    };

    const hasEdits = edits.size > 0;

    // Filter rows by search text (case-insensitive, searches all columns)
    const filteredRows = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((row) =>
            columnsOrder.some((col) => {
                const val = row[col];
                if (val == null) return false;
                return String(val).toLowerCase().includes(q);
            })
        );
    }, [rows, columnsOrder, search]);

    // When search changes, reset to first page to avoid empty pages
    useEffect(() => {
        setPage(1);
    }, [search]);

    // Build updates: ONLY rows where Offset Months changed
    // Payload: { "Commodity Name": <original>, "Offset Months": <edited> }
    const buildUpdatesPayload = () => {
        const updates: Array<Record<string, any>> = [];

        edits.forEach((changed, key) => {
            if (!Object.prototype.hasOwnProperty.call(changed, "Offset Months")) {
                return;
            }

            const row = rows.find((r) => rowKey(r) === key);
            if (!row) return;

            const originalOffset = row["Offset Months"];
            const editedOffset = changed["Offset Months"];

            // If value didn't change, skip
            if (String(editedOffset ?? "") === String(originalOffset ?? "")) {
                return;
            }

            updates.push({
                "Commodity Name": row["Commodity Name"],
                "Offset Months": editedOffset,
            });
        });

        return updates;
    };

    const saveEdits = async () => {
        const updates = buildUpdatesPayload();
        if (!updates.length) {
            message.info("No changes to save.");
            return;
        }

        const sessionId = localStorage.getItem("capex_session_id") ?? "";

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/update_commodity_translation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    updates,
                }),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Save failed (${res.status}) ${txt}`);
            }

            const body = await res.json().catch(() => ({}));

            if (body?.status === "success" || body?.updated || body?.ok) {
                message.success("Updates saved.");
            } else {
                message.success("Save completed.");
            }

            await fetchData();
        } catch (e: any) {
            console.error("Save error:", e);
            message.error(e?.message || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    const resetEdits = () => {
        setEdits(new Map());
        message.info("Edits cleared");
    };

    const downloadCsv = () => {
        if (rows.length === 0) {
            message.warning("No data to export");
            return;
        }

        const headers = columnsOrder.join(",");
        const csvContent = rows
            .map((row) =>
                columnsOrder
                    .map((col) => {
                        const val = row[col];
                        const s = val == null ? "" : String(val);
                        const esc = s.replace(/"/g, '""');
                        return esc.includes(",") ? `"${esc}"` : esc;
                    })
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([`${headers}\n${csvContent}`], {
            type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `commodity_translation_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        message.success("Exported CSV");
    };

    const onTableChange = (pagination: TablePaginationConfig) => {
        const current = pagination.current || 1;
        const size = pagination.pageSize || pageSize;
        setPage(current);
        setPageSize(size);
    };

    const totalScrollX = useMemo(
        () => columnsOrder.reduce((s) => s + 160, 0) + 200,
        [columnsOrder]
    );

    const columns: ColumnsType<Row> = useMemo(() => {
        return columnsOrder.map((name) => {
            // Offset Months is editable
            if (name === "Offset Months") {
                return {
                    title: name,
                    dataIndex: name,
                    key: name,
                    width: 200,
                    render: (_: any, record: Row) => {
                        const k = rowKey(record);
                        const pending = edits.get(k)?.[name];

                        return (
                            <Input
                                size="small"
                                value={
                                    pending !== undefined
                                        ? String(pending)
                                        : record[name] !== undefined
                                            ? String(record[name])
                                            : ""
                                }
                                onChange={(e) => updateCell(k, name, e.target.value)}
                            />
                        );
                    },
                };
            }

            // Commodity Name is read-only
            if (name === "Commodity Name") {
                return {
                    title: name,
                    dataIndex: name,
                    key: name,
                    width: 260,
                    ellipsis: true,
                    render: (val: any) => (val == null ? "" : String(val)),
                };
            }

            // other fields read-only
            return {
                title: name,
                dataIndex: name,
                key: name,
                width: 220,
                ellipsis: true,
                render: (val: any) => (val == null ? "" : String(val)),
            };
        });
    }, [columnsOrder, edits, rows]);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2">
                    <Tooltip title="Reload">
                        <Button
                            type="default"
                            icon={<RefreshCcw size={16} />}
                            onClick={() => fetchData()}
                        />
                    </Tooltip>
                    <span className="text-sm text-gray-600">
                        Commodity Translation · Rows: {filteredRows.length}/{rows.length}
                    </span>
                </div>

                <Space>
                    {/* Search box */}
                    <Input
                        allowClear
                        placeholder="Search by any field…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={(e) => setSearch((e.target as HTMLInputElement).value)}
                        style={{ width: 260 }}
                    />

                    <Button icon={<Download size={16} />} onClick={downloadCsv}>
                        Export CSV
                    </Button>

                    {hasEdits && (
                        <Button icon={<RotateCcw size={16} />} onClick={resetEdits}>
                            Reset
                        </Button>
                    )}

                    {hasEdits && (
                        <Button
                            type="primary"
                            icon={<Save size={16} />}
                            onClick={saveEdits}
                            loading={loading}
                        >
                            Save ({edits.size})
                        </Button>
                    )}
                </Space>
            </div>

            <Table<Row>
                dataSource={filteredRows}
                columns={columns}
                loading={loading}
                rowKey={rowKey}
                pagination={{
                    current: page,
                    pageSize,
                    total: filteredRows.length,
                    showSizeChanger: true,
                    pageSizeOptions: [50, 100, 200],
                }}
                scroll={{ x: totalScrollX }}
                onChange={onTableChange}
                bordered
                size="small"
            />

            {error && (
                <div className="mt-3 text-red-600 text-sm font-mono">{error}</div>
            )}
        </div>
    );
}
