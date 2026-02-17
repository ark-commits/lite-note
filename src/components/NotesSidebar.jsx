const emojiOptions = ['📝', '📌', '✅', '💡', '🚀', '📚', '🧠', '📎', '✨', '🔥']

export default function NotesSidebar({
  notes,
  activeNoteId,
  onSelectNote,
  isCreatingNote,
  onStartCreate,
  newNoteTitle,
  onChangeTitle,
  newNoteEmoji,
  onPickEmoji,
  onCancelCreate,
  onConfirmCreate,
  collapsed = false,
  onToggleCollapse,
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        {!collapsed && <h2 className="font-display text-lg">Notes</h2>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            onClick={() => {
              if (collapsed && onToggleCollapse) {
                onToggleCollapse()
              }
              onStartCreate()
            }}
            aria-label="Create note"
            title="Create note"
          >
            {collapsed ? '+' : '+ New Note'}
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              className="hidden rounded-full border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 md:inline-flex"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? '>' : '<'}
            </button>
          )}
        </div>
      </div>

      {isCreatingNote && !collapsed && (
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600">Note Name</label>
          <input
            value={newNoteTitle}
            onChange={(event) => onChangeTitle(event.target.value)}
            placeholder="Project ideas"
            className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
          />
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Pick Emoji</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {emojiOptions.map((emoji) => {
              const isActive = newNoteEmoji === emoji
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`rounded-lg border px-2 py-1 text-lg transition ${
                    isActive ? 'border-slate-700 bg-slate-200' : 'border-slate-300 bg-white hover:bg-slate-100'
                  }`}
                  onClick={() => onPickEmoji(emoji)}
                  aria-label={`Select ${emoji}`}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={onCancelCreate}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              onClick={onConfirmCreate}
              disabled={!newNoteTitle.trim()}
            >
              Create
            </button>
          </div>
        </div>
      )}

      <ul className="flex-1 space-y-1 overflow-auto p-2">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId
          return (
            <li key={note.id}>
              <button
                type="button"
                className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${
                  collapsed ? 'justify-center' : 'gap-2'
                } ${
                  isActive ? 'bg-slate-200 text-slate-900' : 'text-slate-700 hover:bg-slate-100'
                }`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelectNote(note.id)}
                title={note.title}
              >
                <span className="text-base" aria-hidden="true">
                  {note.emoji}
                </span>
                {!collapsed && <span className="truncate">{note.title}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
