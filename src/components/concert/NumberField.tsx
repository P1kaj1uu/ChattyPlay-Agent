import { useEffect, useState } from 'react'

export default function NumberField({
  label,
  value,
  max,
  onCommit
}: {
  label: string
  value: number
  max: number
  onCommit: (value: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  return (
    <label>
      {label}
      <input
        aria-label={label}
        type="number"
        inputMode="numeric"
        min="1"
        max={max}
        step="1"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        onBlur={() => {
          const next =
            draft.trim() && Number.isFinite(Number(draft))
              ? Math.max(1, Math.min(max, Math.round(Number(draft))))
              : value
          setDraft(String(next))
          onCommit(next)
        }}
      />
    </label>
  )
}
