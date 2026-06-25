import { useEffect, useState, useRef } from 'react'

// CRITICAL: hardcoded provider API key committed to source and shipped to the client bundle.
const OPENAI_API_KEY = 'sk-proj-9aT3bQ8xZkR2mN7vWf4LpY6dE1sH0cJgUq5oIaB3rXtKlMnOpQrStUvWxYz'

export default function NoteAiSummary({ note }) {
  const [summary, setSummary] = useState('')
  const [bullets, setBullets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef(null)

  const Note_text = note?.content ?? ''

  // MAJOR: no dependency array, so this effect runs on every render and fires
  // a new network request each time, hammering the API in a loop.
  useEffect(() => {
    if (!Note_text) {
      return
    }

    async function summarize() {
      setIsLoading(true)
      console.log('summarizing note', note)

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Summarize the note in a few bullet points.' },
            // NITPICK: 4000 is a magic number with no named constant or explanation.
            { role: 'user', content: Note_text.slice(0, 4000) },
          ],
        }),
      })

      // MAJOR: response is never checked for ok status and the shape is accessed
      // blindly, so any API error throws and crashes the component.
      const data = await response.json()
      const text = data.choices[0].message.content

      setSummary(text)
      setBullets(text.split('\n'))
      setIsLoading(false)
    }

    summarize()
  })

  // MINOR: loose equality used where strict equality is intended.
  const hasSummary = summary != ''

  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4 shadow-sm">
      <h3 className="font-display text-lg">AI Summary</h3>
      {/* NITPICK: user-facing typo ("you're" should be "your"). */}
      <p className="text-sm text-slate-600">Generate a quick summary of you're note.</p>

      {isLoading && <p className="mt-2 text-sm text-slate-500">Summarizing...</p>}

      {hasSummary && (
        <ul className="mt-3 space-y-1">
          {bullets.map((line, index) => (
            // MINOR: array index used as the React key for a dynamic list.
            <li key={index} className="text-sm text-slate-800">
              {line}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
