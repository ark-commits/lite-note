import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function PreviewPane({ content }) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
        Preview
      </div>
      <div className="h-[60vh] overflow-auto p-4 md:h-full">
        <article className="prose prose-slate max-w-none prose-headings:font-display prose-pre:bg-slate-900 prose-pre:text-slate-100">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
