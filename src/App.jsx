import { useEffect, useMemo, useRef, useState } from 'react'
import EditorPane from './components/EditorPane'
import NotesSidebar from './components/NotesSidebar'
import PreviewPane from './components/PreviewPane'

const starterMarkdown = `# Lite Note

A lightweight Markdown note editor with live preview.

## Quick syntax

### Heading level 3

- Bullet point item
- Another item

1. First numbered item
2. Second numbered item

- [ ] Task list item
- [x] Completed item

Use **bold**, *italic*, and \
\`inline code\`.

\`\`\`js
function hello() {
  return 'code block';
}
\`\`\`

[Open Markdown Guide](https://www.markdownguide.org)

| Syntax | Description |
| --- | --- |
| Header | Title |
| Paragraph | Text |
`

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60

const STORAGE_KEYS = {
  notesV1: 'lite-note:notes:v1',
  notesV2: 'lite-note:notes:v2',
  activeNoteId: 'lite-note:activeNoteId:v1',
}

const generateNoteId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const createDefaultNote = (overrides = {}) => {
  const now = Date.now()
  return {
    id: 'note-1',
    title: 'Lite Note',
    emoji: '📝',
    content: starterMarkdown,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    deletedAt: null,
    ...overrides,
  }
}

const createBlankNote = (title = 'Untitled Note', emoji = '📝') => {
  const now = Date.now()
  return {
    id: generateNoteId(),
    title,
    emoji,
    content: `# ${title}\n\n`,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    deletedAt: null,
  }
}

const isBaseNote = (note) =>
  note &&
  typeof note === 'object' &&
  typeof note.id === 'string' &&
  note.id.trim().length > 0 &&
  typeof note.title === 'string' &&
  typeof note.emoji === 'string' &&
  typeof note.content === 'string' &&
  typeof note.createdAt === 'number' &&
  Number.isFinite(note.createdAt)

const normalizeNotes = (value) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((note) => isBaseNote(note)).map((note) => ({
    ...note,
    updatedAt:
      typeof note.updatedAt === 'number' && Number.isFinite(note.updatedAt) ? note.updatedAt : note.createdAt,
    isPinned: typeof note.isPinned === 'boolean' ? note.isPinned : false,
    deletedAt: typeof note.deletedAt === 'number' ? note.deletedAt : null,
  }))
}

const readNotesFromKey = (key) => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedNotes = window.localStorage.getItem(key)
    if (!storedNotes) {
      return []
    }

    const parsedNotes = JSON.parse(storedNotes)
    return normalizeNotes(parsedNotes)
  } catch {
    return []
  }
}

const readStoredNotes = () => {
  if (typeof window === 'undefined') {
    return [createDefaultNote()]
  }

  const v2Notes = readNotesFromKey(STORAGE_KEYS.notesV2)
  if (v2Notes.length) {
    return v2Notes
  }

  const v1Notes = readNotesFromKey(STORAGE_KEYS.notesV1)
  if (v1Notes.length) {
    return v1Notes
  }

  return [createDefaultNote()]
}

const readStoredActiveNoteId = (notes) => {
  if (typeof window === 'undefined') {
    return notes[0]?.id ?? ''
  }

  try {
    const storedActiveNoteId = window.localStorage.getItem(STORAGE_KEYS.activeNoteId)
    if (!storedActiveNoteId) {
      return notes[0]?.id ?? ''
    }

    const activeNoteExists = notes.some((note) => note.id === storedActiveNoteId)
    return activeNoteExists ? storedActiveNoteId : notes[0]?.id ?? ''
  } catch {
    return notes[0]?.id ?? ''
  }
}

export default function App() {
  const commitDelayMs = 250
  const [notes, setNotes] = useState(readStoredNotes)
  const [activeNoteId, setActiveNoteId] = useState(() => readStoredActiveNoteId(notes))
  const [activeMobileTab, setActiveMobileTab] = useState('edit')
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteEmoji, setNewNoteEmoji] = useState('📝')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileNotesOpen, setIsMobileNotesOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isTrashOpen, setIsTrashOpen] = useState(false)
  const [draftContent, setDraftContent] = useState(
    () => notes.find((note) => note.id === activeNoteId)?.content ?? notes[0]?.content ?? '',
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [storageErrors, setStorageErrors] = useState({
    notes: '',
    activeNoteId: '',
  })
  const [saveStatus, setSaveStatus] = useState('idle')
  const pendingCommitTimerRef = useRef(null)
  const pendingCommitNoteIdRef = useRef(null)
  const pendingCommitValueRef = useRef(null)
  const activeNoteIdRef = useRef(activeNoteId)
  const storageErrorsRef = useRef(storageErrors)

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? notes[0] ?? null,
    [notes, activeNoteId],
  )

  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])

  const trashedNotes = useMemo(
    () => notes.filter((note) => note.deletedAt !== null).sort((a, b) => b.deletedAt - a.deletedAt),
    [notes],
  )

  const visibleNotes = useMemo(() => {
    const sortedNotes = notes.filter((note) => note.deletedAt === null).sort((a, b) => {
      if (normalizedSearchQuery) {
        return b.updatedAt - a.updatedAt
      }

      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1
      }

      return b.updatedAt - a.updatedAt
    })

    if (!normalizedSearchQuery) {
      return sortedNotes
    }

    return sortedNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(normalizedSearchQuery) ||
        note.content.toLowerCase().includes(searchQuery),
    )
  }, [notes, normalizedSearchQuery])

  const storageErrorMessage = useMemo(() => {
    if (storageErrors.notes && storageErrors.activeNoteId) {
      return `${storageErrors.notes} ${storageErrors.activeNoteId}`
    }
    return storageErrors.notes || storageErrors.activeNoteId || ''
  }, [storageErrors])

  const saveStatusConfig = useMemo(() => {
    if (saveStatus === 'saving') {
      return {
        label: 'Saving...',
        className: 'border-amber-300 bg-amber-50 text-amber-800',
      }
    }
    if (saveStatus === 'saved') {
      return {
        label: 'All changes saved',
        className: 'border-emerald-300 bg-emerald-50 text-emerald-800',
      }
    }
    if (saveStatus === 'error') {
      return {
        label: 'Save failed',
        className: 'border-red-300 bg-red-50 text-red-800',
      }
    }
    return {
      label: 'Ready',
      className: 'border-slate-300 bg-white text-slate-700',
    }
  }, [saveStatus])

  useEffect(() => {
    storageErrorsRef.current = storageErrors
  }, [storageErrors])

  useEffect(() => {
    if (!notes.length) {
      return
    }

    const hasActive = notes.some((note) => note.id === activeNoteId)
    if (!hasActive) {
      const nextActiveNoteId = notes[0].id
      setActiveNoteId(nextActiveNoteId)
      activeNoteIdRef.current = nextActiveNoteId
    }
  }, [notes, activeNoteId])

  const commitDraftToNote = (noteId, value) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) => {
        if (note.id !== noteId) {
          return note
        }
        if (note.content === value) {
          return note
        }
        return { ...note, content: value, updatedAt: Date.now() }
      }),
    )
    setIsSyncing(false)
  }

  const flushPendingCommit = () => {
    if (!pendingCommitTimerRef.current) {
      return
    }

    clearTimeout(pendingCommitTimerRef.current)
    pendingCommitTimerRef.current = null

    const noteIdToUpdate = pendingCommitNoteIdRef.current
    const valueToCommit = pendingCommitValueRef.current
    pendingCommitNoteIdRef.current = null
    pendingCommitValueRef.current = null

    if (noteIdToUpdate === null || valueToCommit === null) {
      setIsSyncing(false)
      return
    }

    commitDraftToNote(noteIdToUpdate, valueToCommit)
  }

  useEffect(() => {
    flushPendingCommit()
    setDraftContent(activeNote?.content ?? '')
  }, [activeNote?.id])

  useEffect(
    () => () => {
      if (pendingCommitTimerRef.current) {
        clearTimeout(pendingCommitTimerRef.current)
      }
      pendingCommitTimerRef.current = null
      pendingCommitNoteIdRef.current = null
      pendingCommitValueRef.current = null
    },
    [],
  )

  useEffect(() => {
    const cutoff = Date.now() - THIRTY_DAYS_MS
    setNotes((previousNotes) => previousNotes.filter((note) => note.deletedAt === null || note.deletedAt > cutoff))
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setSaveStatus('saving')
    try {
      window.localStorage.setItem(STORAGE_KEYS.notesV2, JSON.stringify(notes))
      console.debug('[storage] Saved notes to localStorage')
      setStorageErrors((previous) => ({ ...previous, notes: '' }))
      setSaveStatus(storageErrorsRef.current.activeNoteId ? 'error' : 'saved')
    } catch (error) {
      console.error('[storage] Failed to save notes to localStorage', error)
      setStorageErrors((previous) => ({
        ...previous,
        notes: 'Notes could not be saved to local storage.',
      }))
      setSaveStatus('error')
    }
  }, [notes])

  useEffect(() => {
    if (typeof window === 'undefined' || !activeNoteId) {
      return
    }

    setSaveStatus('saving')
    try {
      window.localStorage.setItem(STORAGE_KEYS.activeNoteId, activeNoteId)
      console.debug('[storage] Saved active note id to localStorage')
      setStorageErrors((previous) => ({ ...previous, activeNoteId: '' }))
      setSaveStatus(storageErrorsRef.current.notes ? 'error' : 'saved')
    } catch (error) {
      console.error('[storage] Failed to save active note id to localStorage', error)
      setStorageErrors((previous) => ({
        ...previous,
        activeNoteId: 'The selected note could not be saved to local storage.',
      }))
      setSaveStatus('error')
    }
  }, [activeNoteId])

  const mobileTabClass = useMemo(
    () =>
      'rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500',
    [],
  )

  const createNoteId = () => generateNoteId()

  const handleSelectNote = (noteId) => {
    if (noteId === activeNoteId || noteId === activeNoteIdRef.current) {
      setIsMobileNotesOpen(false)
      return
    }

    flushPendingCommit()
    setActiveNoteId(noteId)
    activeNoteIdRef.current = noteId
    const selectedNote = notes.find((note) => note.id === noteId)
    setDraftContent(selectedNote?.content ?? '')
    setIsMobileNotesOpen(false)
  }

  const handleChangeContent = (value) => {
    setDraftContent(value)
    setIsSyncing(true)

    if (pendingCommitTimerRef.current) {
      clearTimeout(pendingCommitTimerRef.current)
    }

    const noteIdToUpdate = activeNoteIdRef.current
    pendingCommitNoteIdRef.current = noteIdToUpdate
    pendingCommitValueRef.current = value

    pendingCommitTimerRef.current = setTimeout(() => {
      commitDraftToNote(noteIdToUpdate, value)
      pendingCommitTimerRef.current = null
      pendingCommitNoteIdRef.current = null
      pendingCommitValueRef.current = null
    }, commitDelayMs)
  }

  const handleConfirmCreateNote = () => {
    const trimmedTitle = newNoteTitle.trim()
    if (!trimmedTitle) {
      return
    }

    flushPendingCommit()

    const now = Date.now()
    const createdNote = {
      id: createNoteId(),
      title: trimmedTitle,
      emoji: newNoteEmoji || '📝',
      content: `# ${trimmedTitle}\n\n`,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
      deletedAt: null,
    }

    setNotes((previousNotes) => [...previousNotes, createdNote])
    setActiveNoteId(createdNote.id)
    activeNoteIdRef.current = createdNote.id
    setDraftContent(createdNote.content)
    setActiveMobileTab('edit')
    setNewNoteTitle('')
    setNewNoteEmoji('📝')
    setIsCreatingNote(false)
    setIsMobileNotesOpen(false)
  }

  const handleCancelCreateNote = () => {
    setIsCreatingNote(false)
    setNewNoteTitle('')
    setNewNoteEmoji('📝')
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
  }

  const handleRenameNote = (noteId, nextTitle) => {
    const trimmedTitle = nextTitle.trim()
    if (!trimmedTitle) {
      return
    }

    flushPendingCommit()

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === noteId ? { ...note, title: trimmedTitle, updatedAt: Date.now() } : note,
      ),
    )
  }

  const handleDeleteNote = (noteId) => {
    flushPendingCommit()

    const liveNotes = notes.filter((note) => note.deletedAt === null && note.id !== noteId)

    if (!liveNotes.length) {
      const fallbackNote = createBlankNote()
      setNotes((previousNotes) =>
        previousNotes.map((note) => (note.id === noteId ? { ...note, deletedAt: Date.now() } : note)).concat(fallbackNote),
      )
      setActiveNoteId(fallbackNote.id)
      activeNoteIdRef.current = fallbackNote.id
      setDraftContent(fallbackNote.content)
      return
    }

    if (activeNoteIdRef.current === noteId) {
      const nextActiveNote = liveNotes[0]
      setActiveNoteId(nextActiveNote.id)
      activeNoteIdRef.current = nextActiveNote.id
      setDraftContent(nextActiveNote.content)
    }

    setNotes((previousNotes) =>
      previousNotes.map((note) => (note.id === noteId ? { ...note, deletedAt: Date.now() } : note)),
    )
  }

  const handleRestoreNote = (noteId) => {
    setNotes((previousNotes) =>
      previousNotes.map((note) => (note.id === noteId ? { ...note, deletedAt: null } : note)),
    )
  }

  const handlePermanentDeleteNote = (noteId) => {
    setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId))
  }

  const handleDuplicateNote = (noteId) => {
    flushPendingCommit()

    const sourceNote = notes.find((note) => note.id === noteId)
    if (!sourceNote) {
      return
    }

    const now = Date.now()
    const duplicatedNote = {
      ...sourceNote,
      id: createNoteId(),
      title: `${sourceNote.title} Copy`,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    }

    setNotes((previousNotes) => [...previousNotes, duplicatedNote])
    setActiveNoteId(duplicatedNote.id)
    activeNoteIdRef.current = duplicatedNote.id
    setDraftContent(duplicatedNote.content)
    setActiveMobileTab('edit')
    setIsMobileNotesOpen(false)
  }

  const handleTogglePin = (noteId) => {
    flushPendingCommit()

    setNotes((previousNotes) =>
      previousNotes.map((note) =>
        note.id === noteId ? { ...note, isPinned: !note.isPinned, updatedAt: Date.now() } : note,
      ),
    )
  }

  return (
    <main className="min-h-screen bg-paper text-slate-900">
      <div className="flex min-h-screen w-full flex-col px-3 py-4 sm:px-4 lg:px-5">
        <header className="mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Lite Note</h1>
              <p className="mt-1 text-sm text-slate-700">Create notes, add emojis, and edit markdown live.</p>
            </div>
            <p
              aria-live="polite"
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${saveStatusConfig.className}`}
            >
              {saveStatusConfig.label}
            </p>
          </div>
          {storageErrorMessage && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
            >
              {storageErrorMessage}
            </p>
          )}
        </header>

        <section className="flex min-h-0 flex-1 gap-4">
          <aside className={`hidden shrink-0 transition-all md:block ${isSidebarCollapsed ? 'w-16' : 'w-80'}`}>
            <NotesSidebar
              notes={visibleNotes}
              activeNoteId={activeNote?.id ?? ''}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onSelectNote={handleSelectNote}
              isCreatingNote={isCreatingNote}
              onStartCreate={() => setIsCreatingNote(true)}
              newNoteTitle={newNoteTitle}
              onChangeTitle={setNewNoteTitle}
              newNoteEmoji={newNoteEmoji}
              onPickEmoji={setNewNoteEmoji}
              onCancelCreate={handleCancelCreateNote}
              onConfirmCreate={handleConfirmCreateNote}
              onRenameNote={handleRenameNote}
              onDeleteNote={handleDeleteNote}
              onDuplicateNote={handleDuplicateNote}
              onTogglePin={handleTogglePin}
              trashedNotes={trashedNotes}
              isTrashOpen={isTrashOpen}
              onToggleTrash={() => setIsTrashOpen((previous) => !previous)}
              onRestoreNote={handleRestoreNote}
              onPermanentDeleteNote={handlePermanentDeleteNote}
              collapsed={isSidebarCollapsed}
              onToggleCollapse={() => setIsSidebarCollapsed((previous) => !previous)}
            />
          </aside>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="mb-3 flex gap-2 md:hidden">
              <button
                type="button"
                className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                onClick={() => setIsMobileNotesOpen(true)}
              >
                Notes
              </button>
              <div className="flex gap-2" role="tablist" aria-label="Editor or preview">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMobileTab === 'edit'}
                  className={`${mobileTabClass} ${
                    activeMobileTab === 'edit'
                      ? 'bg-ink text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                  onClick={() => setActiveMobileTab('edit')}
                >
                  Edit
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeMobileTab === 'preview'}
                  className={`${mobileTabClass} ${
                    activeMobileTab === 'preview'
                      ? 'bg-ink text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                  onClick={() => setActiveMobileTab('preview')}
                >
                  Preview
                </button>
              </div>
            </div>

            <section className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
              <div className={activeMobileTab === 'preview' ? 'hidden md:block' : ''}>
                <EditorPane
                  value={draftContent}
                  onChange={handleChangeContent}
                  disabled={!activeNote}
                  isSyncing={isSyncing}
                />
              </div>
              <div className={activeMobileTab === 'edit' ? 'hidden md:block' : ''}>
                <PreviewPane content={draftContent} />
              </div>
            </section>
          </div>
        </section>
      </div>

      <div className={`fixed inset-0 z-40 md:hidden ${isMobileNotesOpen ? '' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close notes drawer"
          className={`absolute inset-0 bg-slate-900/40 transition-opacity ${isMobileNotesOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileNotesOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Notes"
          className={`absolute inset-y-0 left-0 w-80 max-w-[85vw] transform bg-paper p-4 shadow-xl transition-transform ${
            isMobileNotesOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <NotesSidebar
            notes={visibleNotes}
            activeNoteId={activeNote?.id ?? ''}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSelectNote={handleSelectNote}
            isCreatingNote={isCreatingNote}
            onStartCreate={() => setIsCreatingNote(true)}
            newNoteTitle={newNoteTitle}
            onChangeTitle={setNewNoteTitle}
            newNoteEmoji={newNoteEmoji}
            onPickEmoji={setNewNoteEmoji}
            onCancelCreate={handleCancelCreateNote}
            onConfirmCreate={handleConfirmCreateNote}
            onRenameNote={handleRenameNote}
            onDeleteNote={handleDeleteNote}
            onDuplicateNote={handleDuplicateNote}
            onTogglePin={handleTogglePin}
            trashedNotes={trashedNotes}
            isTrashOpen={isTrashOpen}
            onToggleTrash={() => setIsTrashOpen((previous) => !previous)}
            onRestoreNote={handleRestoreNote}
            onPermanentDeleteNote={handlePermanentDeleteNote}
          />
        </div>
      </div>
    </main>
  )
}
