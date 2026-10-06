import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDeps } from '../app/deps';
import { setSetting } from '../db/settings';
import { dayKey } from '../domain/dayKey';
import { en } from './en';
import { detectLang, deviceLangs, resolveLang, tr, type Lang, type Localized } from './lang';
import { vi, type Messages } from './vi';

const MESSAGES: Record<Lang, Messages> = { vi, en };
/** gợi ý ngôn ngữ lần trước (chỉ để khỏi nháy lúc mở app); nguồn thật là DB */
const HINT_KEY = 'goh-lang';

interface I18n {
  lang: Lang;
  t: Messages;
  setLang: (l: Lang) => void;
  tr: <T>(l: Localized<T>) => T;
}

const make = (lang: Lang, setLang: (l: Lang) => void): I18n => ({ lang, t: MESSAGES[lang], setLang, tr: (l) => tr(l, lang) });

/** Mặc định (không bọc Provider): tiếng Việt, để test cũ và component lẻ vẫn như trước. */
const I18nContext = createContext<I18n>(make('vi', () => {}));
export const useI18n = () => useContext(I18nContext);

function readHint(): Lang | null {
  try {
    const v = localStorage.getItem(HINT_KEY);
    return v === 'vi' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

function writeHint(l: Lang) {
  try {
    localStorage.setItem(HINT_KEY, l);
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

/**
 * `lang` có giá trị: dùng luôn, không đọc DB (test). Không có: render ngay bằng gợi ý lần trước / ngôn ngữ
 * máy, rồi đổi theo `resolveLang` khi đọc xong DB.
 */
export function I18nProvider({ children, lang: fixed }: { children: ReactNode; lang?: Lang }) {
  const { db, now } = useDeps();
  const [hint] = useState(readHint);
  const [lang, setLangState] = useState<Lang>(() => fixed ?? hint ?? detectLang(deviceLangs()));
  /**
   * Chưa có gợi ý (lần mở đầu sau khi cập nhật, hoặc máy mới): chờ giải xong rồi mới render, kẻo người dùng cũ
   * trên iPhone tiếng Anh thấy tiếng Anh và lời cây của ngày bị chọn bằng tiếng Anh.
   */
  const [ready, setReady] = useState(fixed !== undefined || hint !== null);
  /** người dùng đã tự chọn trong lúc đang giải → đừng ghi đè */
  const chosen = useRef(false);

  useEffect(() => {
    if (fixed) return;
    let alive = true;
    resolveLang(db, dayKey(now()))
      .then((l) => {
        if (alive && !chosen.current) {
          setLangState(l);
          writeHint(l);
        }
        if (alive) setReady(true);
      })
      .catch((e) => {
        console.error(e);
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
    // chỉ giải một lần lúc mở app
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, fixed]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    chosen.current = true;
    setLangState(l);
    writeHint(l);
    setSetting(db, 'language', l).catch(console.error);
  }, [db]);

  const value = useMemo(() => make(lang, setLang), [lang, setLang]);
  return <I18nContext.Provider value={value}>{ready ? children : null}</I18nContext.Provider>;
}
