import React from "react";

interface DataTableProps {
    columns: string[];
    rows: (string | number)[][];
}

export const DataTable: React.FC<DataTableProps> = ({ columns, rows }) => {
    return (
        <div className="overflow-auto max-h-[500px] rounded-xl shadow-md border border-border">
            <table className="min-w-full text-sm text-left text-foreground">
                <thead
                    className="sticky top-0 z-10"
                    style={{
                        background: "white",
                        color: "hsl(var(--primary-foreground))",

                    }}
                >
                    <tr>
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className="px-6 py-3 text-sm font-semibold uppercase tracking-wider border-b border-[hsl(var(--primary)/0.5)]"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            style={{
                                background: rowIndex % 2 === 0
                                    ? "hsl(var(--background-secondary))"
                                    : "hsl(var(--background-tertiary))"
                            }}
                        >
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className="px-6 py-3 text-[hsl(var(--foreground))] border-b border-border"
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
