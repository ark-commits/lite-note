# Lite Note

A lightweight Markdown note editor with live preview, built with React and Vite.

## Features

- **Markdown editing** — Write notes in Markdown with a live preview pane side by side
- **Full-text search** — Search notes by title or content
- **Pinned notes** — Pin important notes to keep them at the top of the list
- **Note organisation** — Create, rename, duplicate, and delete notes
- **Emoji picker** — Assign an emoji to each note for quick visual identification
- **Trash / soft delete** — Deleted notes move to a Trash section instead of being permanently removed. From Trash you can restore a note or delete it forever. Notes that have been in the trash for more than 30 days are automatically removed on startup
- **Collapsible sidebar** — Collapse the notes sidebar to maximise editor space
- **Mobile support** — Responsive layout with a slide-in drawer for the notes list on small screens
- **Persistent storage** — Notes are saved to `localStorage` automatically, with a save-status indicator

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [React 18](https://react.dev) |
| Build tool | [Vite 5](https://vitejs.dev) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com) |
| Markdown rendering | [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) |

## Trash & Soft Delete

When you delete a note it is moved to the **Trash** section at the bottom of the sidebar rather than being permanently removed. The trash section shows a badge with the count of trashed notes and can be toggled open or closed.

From the trash list you can:

- **Restore** — moves the note back to your active notes list
- **Delete Forever** — permanently removes the note

Notes that have been in the trash for more than **30 days** are automatically purged when the application starts.

## Storage

Notes are persisted to `localStorage` under the key `lite-note:notes:v2`. The app transparently migrates notes stored under the legacy `lite-note:notes:v1` schema on first load. The currently active note ID is stored separately under `lite-note:activeNoteId:v1`.
