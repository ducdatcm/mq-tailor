import { useStore } from '../state/store';
import { Logo } from './Logo';
import type { Lang } from '../state/types';

interface Props {
  onNewSession: () => void;
}

export function Header({ onNewSession }: Props) {
  const { state, dispatch, t } = useStore();
  const inSession = state.screen !== 'start' && state.product;

  const setLang = (lang: Lang) => dispatch({ type: 'setLang', lang });

  return (
    <header className="header">
      <div className="brand">
        <Logo className="brand-logo" title={t.brand} />
      </div>
      <span className="demo-badge">{t.demoBadge}</span>
      <div className="header-spacer" />
      {inSession ? (
        <span className="header-product">{t.products[state.product!].name}</span>
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
