import { useEffect, useMemo, useState } from 'react'
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

const STORAGE_KEYS = {
  notes: 'lite-note:notes:v1',
  activeNoteId: 'lite-note:activeNoteId:v1',
}

const createDefaultNote = () => ({
  id: 'note-1',
  title: 'Lite Note',
  emoji: '📝',
  content: starterMarkdown,
  createdAt: Date.now(),
})

const isValidNote = (note) =>
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
  return value.filter((note) => isValidNote(note))
}

const readStoredNotes = () => {
  if (typeof window === 'undefined') {
    return [createDefaultNote()]
  }

  try {
    const storedNotes = window.localStorage.getItem(STORAGE_KEYS.notes)
    if (!storedNotes) {
      return [createDefaultNote()]
    }

    const parsedNotes = JSON.parse(storedNotes)
    const validNotes = normalizeNotes(parsedNotes)
    return validNotes.length ? validNotes : [createDefaultNote()]
  } catch {
    return [createDefaultNote()]
  }
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
  const [notes, setNotes] = useState(readStoredNotes)
  const [activeNoteId, setActiveNoteId] = useState(() => readStoredActiveNoteId(notes))
  const [activeMobileTab, setActiveMobileTab] = useState('edit')
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteEmoji, setNewNoteEmoji] = useState('📝')
  const [isMobileNotesOpen, setIsMobileNotesOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId) ?? notes[0] ?? null,
    [notes, activeNoteId],
  )

  useEffect(() => {
    if (!notes.length) {
      return
    }
    const hasActive = notes.some((note) => note.id === activeNoteId)
    if (!hasActive) {
      setActiveNoteId(notes[0].id)
    }
  }, [notes, activeNoteId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes))
    } catch {}
  }, [notes])

  useEffect(() => {
    if (typeof window === 'undefined' || !activeNoteId) {
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEYS.activeNoteId, activeNoteId)
    } catch {}
  }, [activeNoteId])

  const mobileTabClass = useMemo(
    () =>
      'rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-500',
    [],
  )

  const createNoteId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  const handleSelectNote = (noteId) => {
    setActiveNoteId(noteId)
    setIsMobileNotesOpen(false)
  }

  const handleChangeContent = (value) => {
    if (!activeNote) {
      return
    }
    setNotes((previousNotes) =>
      previousNotes.map((note) => (note.id === activeNote.id ? { ...note, content: value } : note)),
    )
  }

  const handleConfirmCreateNote = () => {
    const trimmedTitle = newNoteTitle.trim()
    if (!trimmedTitle) {
      return
    }

    const createdNote = {
      id: createNoteId(),
      title: trimmedTitle,
      emoji: newNoteEmoji || '📝',
      content: `# ${trimmedTitle}\n\n`,
      createdAt: Date.now(),
    }

    setNotes((previousNotes) => [...previousNotes, createdNote])
    setActiveNoteId(createdNote.id)
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

  return (
    <main className="min-h-screen bg-paper text-slate-900">
      <div className="flex min-h-screen w-full flex-col px-3 py-4 sm:px-4 lg:px-5">
        <header className="mb-4">
          <h1 className="font-display text-2xl tracking-tight sm:text-3xl">Lite Note</h1>
          <p className="mt-1 text-sm text-slate-700">Create notes, add emojis, and edit markdown live.</p>
        </header>

        <section className="flex min-h-0 flex-1 gap-4">
          <aside className={`hidden shrink-0 transition-all md:block ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}>
            <NotesSidebar
              notes={notes}
              activeNoteId={activeNote?.id ?? ''}
              onSelectNote={handleSelectNote}
              isCreatingNote={isCreatingNote}
              onStartCreate={() => setIsCreatingNote(true)}
              newNoteTitle={newNoteTitle}
              onChangeTitle={setNewNoteTitle}
              newNoteEmoji={newNoteEmoji}
              onPickEmoji={setNewNoteEmoji}
              onCancelCreate={handleCancelCreateNote}
              onConfirmCreate={handleConfirmCreateNote}
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
                <EditorPane value={activeNote?.content ?? ''} onChange={handleChangeContent} disabled={!activeNote} />
              </div>
              <div className={activeMobileTab === 'edit' ? 'hidden md:block' : ''}>
                <PreviewPane content={activeNote?.content ?? ''} />
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
            notes={notes}
            activeNoteId={activeNote?.id ?? ''}
            onSelectNote={handleSelectNote}
            isCreatingNote={isCreatingNote}
            onStartCreate={() => setIsCreatingNote(true)}
            newNoteTitle={newNoteTitle}
            onChangeTitle={setNewNoteTitle}
            newNoteEmoji={newNoteEmoji}
            onPickEmoji={setNewNoteEmoji}
            onCancelCreate={handleCancelCreateNote}
            onConfirmCreate={handleConfirmCreateNote}
          />
        </div>
      </div>
    </main>
  )
}
