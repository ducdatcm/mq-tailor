import { useRef } from 'react';
import { productList } from '../order/labels';
import { useStore } from '../state/store';
import { Logo } from './Logo';
import type { Lang } from '../state/types';

interface Props {
  onNewSession: () => void;
}

export function Header({ onNewSession }: Props) {
  const { state, dispatch, t } = useStore();
  const inSession = state.screen !== 'start' && state.units.length > 0;

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
      </div>
      <span className="demo-badge">{t.demoBadge}</span>
      <div className="header-spacer" />
      {inSession ? (
        <span className="header-product">{productList(t, state.quantities)}</span>
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
      {inSession ? (
        <button type="button" className="btn btn-quiet" onClick={onNewSession}>
          {t.newSession}
        </button>
      ) : null}
    </header>
  );
}
