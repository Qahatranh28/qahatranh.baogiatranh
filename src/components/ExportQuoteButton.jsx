export default function ExportQuoteButton({ onExport, disabled, message, warning }) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <button
        onClick={onExport}
        disabled={disabled}
        className="sm:w-auto w-full bg-blueprint hover:bg-blueprint-light disabled:bg-line disabled:text-blueprint/40 disabled:cursor-not-allowed text-paper font-medium rounded-md px-6 py-3 transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M8 1.5v9M8 10.5 4.5 7M8 10.5 11.5 7M2 12.5v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Xuất báo giá
      </button>
      {warning ? (
        <p className="text-sm text-red-600 font-medium">{warning}</p>
      ) : (
        message && <p className="text-sm text-amber font-medium">{message}</p>
      )}
    </div>
  )
}
