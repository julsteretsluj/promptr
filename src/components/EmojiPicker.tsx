const EMOJI_CHOICES = [
  '✨',
  '🚿',
  '🍽️',
  '🧹',
  '🦷',
  '💄',
  '👕',
  '📚',
  '🛒',
  '🧺',
  '🛏️',
  '🍳',
  '🚪',
  '💪',
  '🧠',
  '☀️',
  '🌙',
  '☕',
  '🧘',
  '📝',
  '🎯',
  '⏰',
  '💊',
  '🏃',
  '🧼',
  '🎧',
  '📦',
  '🌱',
  '🐶',
  '💧',
]

type Props = {
  value: string
  onChange: (emoji: string) => void
}

export function EmojiPicker({ value, onChange }: Props) {
  return (
    <fieldset className="field emoji-picker">
      <legend className="field-label">Icon</legend>
      <div className="emoji-grid" role="listbox" aria-label="Checklist emoji">
        {EMOJI_CHOICES.map((emoji) => (
          <button
            key={emoji}
            type="button"
            role="option"
            aria-selected={value === emoji}
            className={value === emoji ? 'emoji-swatch active' : 'emoji-swatch'}
            onClick={() => onChange(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <label className="field" style={{ marginTop: 10 }}>
        <span className="field-label">Or type any emoji</span>
        <input
          className="text-input"
          value={value}
          onChange={(e) => {
            const next = e.target.value.trim()
            // Keep at most a short emoji cluster
            onChange(next.slice(0, 8) || '✨')
          }}
          placeholder="✨"
          inputMode="text"
          autoComplete="off"
          aria-label="Custom emoji"
        />
      </label>
    </fieldset>
  )
}

export { EMOJI_CHOICES }
