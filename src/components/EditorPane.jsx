export default function EditorPane({ value, onChange, disabled = false, isSyncing = false }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        <span>Markdown Editor</span>
        <span>{isSyncing ? 'Syncing...' : 'Saved'}</span>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[60vh] w-full flex-1 resize-none bg-transparent p-4 font-mono text-sm leading-6 text-slate-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 md:h-full"
        placeholder="Type markdown here..."
        spellCheck={false}
        disabled={disabled}
      />
    </div>
  )
}
