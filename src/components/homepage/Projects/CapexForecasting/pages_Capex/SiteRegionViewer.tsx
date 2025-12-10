import { useCallback, useEffect, useMemo, useState } from "react";
import { Table, Button, Space, message, Tooltip, Input } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { Download, RefreshCcw, Save } from "lucide-react";

type SiteRegionRow = Record<string, any>;
const API_BASE = import.meta.env.VITE_CAPEX_BASE_URL || "";

export default function SiteRegionViewer() {
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<SiteRegionRow[]>([]);
    const [columnsOrder, setColumnsOrder] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [page, setPage] = useState(1);

    // Track edited values (rowKey → { Region, Site })
    const [edits, setEdits] = useState<Map<string, Partial<SiteRegionRow>>>(new Map());

    // Search text
    const [search, setSearch] = useState("");

    // Stable row key generator
    const assignStableKeys = (arr: any[]) =>
        arr.map((row, i) => ({
            ...row,
            __key: `${row.Site || row.site || row.ID || row.id || "row"}_${i}`,
        }));

    const fetchData = useCallback(
        async (pageNum: number, pageSz: number) => {
            setLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams();
                params.set("limit", String(pageSz));
                params.set("offset", String((pageNum - 1) * pageSz));

                const url = `${API_BASE}/view_site_region?${params.toString()}`;
                const res = await fetch(url);

                const data = await res.json().catch(() => {
                    throw new Error("Invalid JSON from server");
                });

                if (data.status !== "success") {
                    throw new Error(data.message || "Failed to load data");
                }

                const fetchedRows = Array.isArray(data.data) ? data.data : [];
                const rowsWithKeys = assignStableKeys(fetchedRows);

                setRows(rowsWithKeys);
                setTotal(typeof data.total === "number" ? data.total : fetchedRows.length);

                if (Array.isArray(data.columns) && data.columns.length > 0) {
                    setColumnsOrder(data.columns);
                } else {
                    setColumnsOrder(Object.keys(fetchedRows[0] || {}));
                }

                setEdits(new Map()); // reset edits on reload
            } catch (e: any) {
                console.error("Error in fetchData:", e);
                const msg = e?.message || "Failed to load data";
                setError(msg);
                message.error(msg);
                setRows([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        },
        [API_BASE]
    );

    useEffect(() => {
        fetchData(page, pageSize);
    }, [page, pageSize, fetchData]);

    const rowKey = (record: SiteRegionRow) => record.__key;

    // Track edits for Region & Site
    const updateCell = (rKey: string, column: string, value: string) => {
        setEdits((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(rKey) || {};
            updated.set(rKey, { ...existing, [column]: value });
            return updated;
        });
    };

    // Save button visible only when edits exist
    const hasEdits = edits.size > 0;

    // SAVE ALL ROWS (edited + unedited)
    const saveEdits = async () => {
        const sessionId = localStorage.getItem("capex_session_id") ?? "";

        // Build full payload for ALL rows, applying edits and removing __key
        const fullDataPayload = rows.map((row) => {
            const changed = edits.get(row.__key) ?? {};
            const { __key, ...rest } = row;
            return { ...rest, ...changed };
        });

        if (fullDataPayload.length === 0) {
            message.info("No data available to save");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/view_site_region`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    data: fullDataPayload,
                }),
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Save failed (${res.status}) ${txt}`);
            }

            const data = await res.json().catch(() => ({}));
            if (data?.status === "success" || data?.updated || data?.ok) {
                message.success("All rows saved successfully.");
            } else {
                message.success("Save completed (server returned non-standard response).");
            }

            // Refresh and clear frontend edits
            fetchData(page, pageSize);
        } catch (e: any) {
            console.error("Save error:", e);
            message.error(e?.message || "Failed to save changes");
        } finally {
            setLoading(false);
        }
    };

    // Filter rows by search text (case-insensitive, all columns)
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

    // Reset to first page when search changes
    useEffect(() => {
        setPage(1);
    }, [search]);

    const onTableChange = (pagination: TablePaginationConfig) => {
        const current = pagination.current || 1;
        const size = pagination.pageSize || pageSize;
        setPage(current);
        setPageSize(size);
    };

    const totalScrollX = useMemo(
        () => columnsOrder.reduce((sum) => sum + 150, 0) + 200,
        [columnsOrder]
    );

    const columns: ColumnsType<SiteRegionRow> = useMemo(() => {
        return columnsOrder.map((name) => {
            // Editable fields
            if (name === "Region" || name === "Site") {
                return {
                    title: name,
                    dataIndex: name,
                    key: name,
                    width: 150,
                    render: (_: any, record: SiteRegionRow) => {
                        const rKey = rowKey(record);
                        const pendingEdit = edits.get(rKey)?.[name];

                        return (
                            <Input
                                size="small"
                                value={pendingEdit ?? record[name] ?? ""}
                                onChange={(e) => updateCell(rKey, name, e.target.value)}
                                className="font-mono"
                            />
                        );
                    },
                };
            }

            // Non-editable fields
            return {
                title: name,
                dataIndex: name,
                key: name,
                width: 150,
                ellipsis: true,
                render: (val: any) => (val == null ? "" : String(val)),
            };
        });
    }, [columnsOrder, edits]);

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
                        const str = val == null ? "" : String(val);
                        const safe = str.replace(/"/g, '""');
                        return safe.includes(",") ? `"${safe}"` : safe;
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
        link.download = `site_region_data_${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);

        message.success("Data exported as CSV");
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
                        Site Region Data · Rows: {filteredRows.length}/{total}
                    </span>
                </div>

                <Space>
                    {/* Search input */}
                    <Input
                        allowClear
                        placeholder="Search by any field…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={(e) =>
                            setSearch((e.target as HTMLInputElement).value)
                        }
                        style={{ width: 260 }}
                    />

                    <Button icon={<Download size={16} />} onClick={downloadCsv}>
                        Export CSV
                    </Button>

                    {hasEdits && (
                        <Button
                            type="primary"
                            icon={<Save size={16} />}
                            onClick={saveEdits}
                        >
                            Save
                        </Button>
                    )}
                </Space>
            </div>

            <Table<SiteRegionRow>
                dataSource={filteredRows}
                columns={columns}
                loading={loading}
                rowKey={rowKey}
                pagination={{
                    current: page,
                    pageSize,
                    total: filteredRows.length,
                    showSizeChanger: true,
                    pageSizeOptions: [25, 50, 100, 200],
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
