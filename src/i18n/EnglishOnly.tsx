import i18n from 'i18next';
import { type ReactNode, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';

// The staff tools (coordinator, admin and head of department) are written in English only: they are
// working tools for people who publish content, and the forms use the same words as the database. This
// keeps a staff member's phone language from turning them into a half-translated screen. Everything
// inside sees English, while the student and buddy apps keep following the chosen language.
export function EnglishOnly({ children }: { children: ReactNode }) {
  const english = useMemo(() => i18n.cloneInstance({ lng: 'en' }), []);
  return <I18nextProvider i18n={english}>{children}</I18nextProvider>;
}
