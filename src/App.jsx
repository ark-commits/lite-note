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

export default function App() {
  const commitDelayMs = 250
  const [notes, setNotes] = useState(() => [
    {
      id: 'note-1',
      title: 'Lite Note',
      emoji: '📝',
      content: starterMarkdown,
      createdAt: Date.now(),
    },
  ])
  const [activeNoteId, setActiveNoteId] = useState('note-1')
  const [activeMobileTab, setActiveMobileTab] = useState('edit')
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteEmoji, setNewNoteEmoji] = useState('📝')
  const [isMobileNotesOpen, setIsMobileNotesOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [draftContent, setDraftContent] = useState(starterMarkdown)
  const [isSyncing, setIsSyncing] = useState(false)
  const pendingCommitTimerRef = useRef(null)
  const activeNoteIdRef = useRef('note-1')

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
    activeNoteIdRef.current = activeNoteId
  }, [activeNoteId])

  useEffect(() => {
    setDraftContent(activeNote?.content ?? '')
  }, [activeNote?.id, activeNote?.content])

  useEffect(
    () => () => {
      if (pendingCommitTimerRef.current) {
        clearTimeout(pendingCommitTimerRef.current)
      }
    },
    [],
  )

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

    pendingCommitTimerRef.current = setTimeout(() => {
      setNotes((previousNotes) =>
        previousNotes.map((note) =>
          note.id === activeNoteIdRef.current ? { ...note, content: value } : note,
        ),
      )
      setIsSyncing(false)
      pendingCommitTimerRef.current = null
    }, commitDelayMs)
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
