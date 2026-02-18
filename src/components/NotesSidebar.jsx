const emojiOptions = ['📝', '📌', '✅', '💡', '🚀', '📚', '🧠', '📎', '✨', '🔥']

const formatEditedAt = (timestamp) => {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return ''
  }

  const diffMs = Math.max(0, Date.now() - timestamp)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) {
    return 'Edited just now'
  }
  if (diffMs < hour) {
    return `Edited ${Math.floor(diffMs / minute)}m ago`
  }
  if (diffMs < day) {
    return `Edited ${Math.floor(diffMs / hour)}h ago`
  }
  return `Edited ${Math.floor(diffMs / day)}d ago`
}

export default function NotesSidebar({
  notes,
  activeNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  isCreatingNote,
  onStartCreate,
  newNoteTitle,
  onChangeTitle,
  newNoteEmoji,
  onPickEmoji,
  onCancelCreate,
  onConfirmCreate,
  onRenameNote,
  onDeleteNote,
  onDuplicateNote,
  onTogglePin,
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

      {!collapsed && (
        <div className="border-b border-slate-200 bg-slate-50 p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="note-search">
            Search Notes
          </label>
          <input
            id="note-search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by title"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-300 focus:ring-2"
          />
        </div>
      )}

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

      <ul className="flex-1 space-y-2 overflow-auto p-2">
        {notes.map((note) => {
          const isActive = note.id === activeNoteId
          return (
            <li key={note.id}>
              <div
                className={`rounded-lg border px-2 py-2 transition ${
                  isActive ? 'border-slate-400 bg-slate-100' : 'border-transparent bg-white hover:bg-slate-50'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                  <button
                    type="button"
                    className={`min-w-0 text-left ${collapsed ? 'w-auto' : 'flex-1'}`}
                    aria-current={isActive ? 'true' : undefined}
                    onClick={() => onSelectNote(note.id)}
                    title={note.title}
                  >
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
                      <span className="text-base" aria-hidden="true">
                        {note.emoji}
                      </span>
                      {!collapsed && (
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{note.title}</p>
                          <p className="truncate text-xs text-slate-500">{formatEditedAt(note.updatedAt)}</p>
                        </div>
                      )}
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="ml-2 flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className={`rounded px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                          note.isPinned
                            ? 'bg-slate-700 text-white hover:bg-slate-800'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        onClick={() => onTogglePin(note.id)}
                        aria-label={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        {note.isPinned ? 'Pinned' : 'Pin'}
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-300"
                        onClick={() => {
                          const nextTitle = window.prompt('Rename note', note.title)
                          if (nextTitle !== null) {
                            onRenameNote(note.id, nextTitle)
                          }
                        }}
                        aria-label="Rename note"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="rounded bg-slate-200 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-300"
                        onClick={() => onDuplicateNote(note.id)}
                        aria-label="Duplicate note"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        className="rounded bg-red-100 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-200"
                        onClick={() => {
                          const confirmDelete = window.confirm(`Delete "${note.title}"?`)
                          if (confirmDelete) {
                            onDeleteNote(note.id)
                          }
                        }}
                        aria-label="Delete note"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}

        {!notes.length && (
          <li className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
            No notes match this search.
          </li>
        )}
      </ul>
    </div>
  )
}
