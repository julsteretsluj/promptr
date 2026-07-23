import { Icon, isIconName, type IconName } from './Icon'

type Props = {
  icon: IconName | string
  color?: string
  size?: number
  className?: string
}

/** Renders a preset SVG icon or a custom emoji glyph. */
export function RoutineGlyph({ icon, color = '#007AFF', size = 22, className }: Props) {
  if (isIconName(icon)) {
    return (
      <span className={['glyph', className].filter(Boolean).join(' ')} style={{ background: color }}>
        <Icon name={icon} size={size} />
      </span>
    )
  }

  return (
    <span
      className={['glyph', 'glyph-emoji', className].filter(Boolean).join(' ')}
      style={{ background: color }}
      aria-hidden
    >
      {icon || '✨'}
    </span>
  )
}
