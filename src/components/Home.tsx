import { useEffect, useState } from 'react'
import { CUSTOM_STORAGE_KEY, PRESETS } from '../data/presets'
import type { Routine } from '../types'
import { Icon } from './Icon'

type Props = {
  onStart: (routine: Routine) => void
  onCreateCustom: () => void
}

function loadCustomRoutines(): Routine[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Routine[]
  } catch {
    return []
  }
}

export function Home({ onStart, onCreateCustom }: Props) {
  const [custom, setCustom] = useState<Routine[]>([])

  useEffect(() => {
    setCustom(loadCustomRoutines())
  }, [])

  const deleteCustom = (id: string) => {
    const next = custom.filter((r) => r.id !== id)
    setCustom(next)
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <div className="page home-page">
      <header className="hero">
        <div className="hero-glow" aria-hidden />
        <p className="hero-kicker">Gentle step-by-step prompts</p>
        <h1 className="brand">Promptr</h1>
        <p className="hero-sub">
          Break everyday tasks into clear next steps — built for brains that need a nudge.
        </p>
      </header>

      <section className="section" aria-labelledby="start-heading">
        <div className="section-head">
          <h2 id="start-heading">Start a routine</h2>
          <p>Pick a preset or make your own. One step at a time.</p>
        </div>

        <button type="button" className="custom-cta" onClick={onCreateCustom}>
          <span className="custom-cta-icon" aria-hidden>
            <Icon name="plus" size={26} />
          </span>
          <span className="custom-cta-text">
            <strong>Custom checklist</strong>
            <span>Add your own steps</span>
          </span>
          <Icon name="chevron" size={22} className="row-chevron" />
        </button>

        {custom.length > 0 && (
          <ul className="list-group" aria-label="Your custom routines">
            {custom.map((routine) => (
              <li key={routine.id} className="list-row-wrap">
                <button type="button" className="list-row" onClick={() => onStart(routine)}>
                  <span className="glyph" style={{ background: routine.color }}>
                    <Icon name="sparkle" size={22} />
                  </span>
                  <span className="list-row-text">
                    <strong>{routine.title}</strong>
                    <span>
                      {routine.steps.length} step{routine.steps.length === 1 ? '' : 's'}
                    </span>
                  </span>
                  <Icon name="chevron" size={22} className="row-chevron" />
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteCustom(routine.id)}
                  aria-label={`Delete ${routine.title}`}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <ul className="list-group" aria-label="Preset routines">
          {PRESETS.map((routine) => (
            <li key={routine.id}>
              <button type="button" className="list-row" onClick={() => onStart(routine)}>
                <span className="glyph" style={{ background: routine.color }}>
                  <Icon name={routine.icon} size={22} />
                </span>
                <span className="list-row-text">
                  <strong>{routine.title}</strong>
                  <span>{routine.description}</span>
                </span>
                <Icon name="chevron" size={22} className="row-chevron" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
