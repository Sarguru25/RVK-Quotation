import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { memo } from "react";

function DataTable({
  columns,
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  onSearch,
  searchValue,
  renderRow,
  emptyStateText = "No records found",
  emptyStateSubtext = "Try adjusting your search criteria"
}) {
  const totalPages = Math.ceil((total || 0) / limit);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value={20}>20 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
            <option value={200}>200 rows</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 min-h-[400px]">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 relative">
            {loading && data.length === 0 ? (
              // Skeleton Loading State
              Array.from({ length: Math.min(limit, 10) }).map((_, idx) => (
                <tr key={`skeleton-${idx}`}>
                  {columns.map((_, colIdx) => (
                    <td key={colIdx} className="px-5 py-4">
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length > 0 ? (
              data.map((row, idx) => renderRow(row, idx))
            ) : (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Search size={48} className="text-slate-200 mb-4" />
                    <p className="text-slate-600 font-medium text-base mb-1">{emptyStateText}</p>
                    <p className="text-slate-400 text-sm">{emptyStateSubtext}</p>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Overlay loading indicator for refetching */}
            {loading && data.length > 0 && (
              <tr>
                <td colSpan={columns.length} className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-100">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium text-slate-700">Loading...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <div className="flex items-center gap-1 overflow-x-auto px-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              // Show limited pages (first, last, current, current-1, current+1)
              if (
                pageNum === 1 || 
                pageNum === totalPages || 
                (pageNum >= page - 1 && pageNum <= page + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === page - 2 || 
                pageNum === page + 2
              ) {
                return <span key={pageNum} className="px-1 text-slate-400">...</span>;
              }
              return null;
            })}
          </div>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(DataTable);
