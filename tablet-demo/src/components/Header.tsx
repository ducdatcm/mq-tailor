import { useRef } from 'react';
import { useStore } from '../state/store';
import { CheckIcon } from './icons';
import { Logo } from './Logo';
import type { Lang, Screen } from '../state/types';

interface Props {
  onNewSession: () => void;
}

/** Which of the four stages of a visit a screen belongs to (all four are done once the order is confirmed). */
const STAGE: Record<Screen, number> = { start: 0, configure: 1, review: 2, order: 3, confirmed: 4 };

export function Header({ onNewSession }: Props) {
  const { state, dispatch, t } = useStore();
  const inSession = state.screen !== 'start' && state.units.length > 0;
  const stage = STAGE[state.screen] ?? 0;

  const setLang = (lang: Lang) => dispatch({ type: 'setLang', lang });

  // Staff shortcut to the setup page: five quick taps on the logo (no visible button for customers).
  const taps = useRef<number[]>([]);
  const tapLogo = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t0) => now - t0 < 3000), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      window.location.hash = '#/setup';
    }
  };

  return (
    <header className="header">
      <div className="brand" onClick={tapLogo}>
        <Logo className="brand-logo" title={t.brand} />
        <span className="demo-badge">{t.demoBadge}</span>
      </div>
      <ol className="flow" aria-label={t.progress.label}>
        {t.progress.steps.map((label, i) => (
          <li
            key={label}
            className={`flow-step${i < stage ? ' is-done' : i === stage ? ' is-current' : ''}`}
            aria-current={i === stage ? 'step' : undefined}
          >
            <span className="flow-dot" aria-hidden="true">
              {i < stage ? <CheckIcon size={14} /> : i + 1}
            </span>
            <span className="flow-label">{label}</span>
          </li>
        ))}
      </ol>
      <div className="header-actions">
        {inSession ? (
          <button type="button" className="btn btn-quiet" onClick={onNewSession}>
            {t.newSession}
          </button>
        ) : null}
        <div className="lang-switch" role="group" aria-label={t.language.label}>
          {(['vi', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              lang={lang}
              aria-pressed={state.lang === lang}
              onClick={() => setLang(lang)}
              aria-label={lang === 'vi' ? 'VI — Tiếng Việt' : 'EN — English'}
            >
              {t.language[lang]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
