import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import {
  COOKIE_NOTICE_KEY,
  hasSeenCookieNotice,
  markCookieNoticeSeen,
} from "../../app/_shared/utils/cookieNotice";

describe("Aviso de cookies", () => {
  afterEach(() => vi.unstubAllGlobals());

  const stubStorage = (initial: Record<string, string> = {}) => {
    const storage = new Map(Object.entries(initial));
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
    return storage;
  };

  test("se muestra hasta que se marca como visto", () => {
    const storage = stubStorage();
    expect(hasSeenCookieNotice()).toBe(false);
    markCookieNoticeSeen();
    expect(hasSeenCookieNotice()).toBe(true);
    expect(storage.get(COOKIE_NOTICE_KEY)).toBe("1");
  });

  test("una versión anterior del aviso cuenta como no vista", () => {
    stubStorage({ [COOKIE_NOTICE_KEY]: "0" });
    expect(hasSeenCookieNotice()).toBe(false);
  });

  test("sin almacenamiento disponible se muestra y cerrar no falla", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("bloqueado");
      },
      setItem: () => {
        throw new Error("bloqueado");
      },
    });
    expect(hasSeenCookieNotice()).toBe(false);
    expect(() => markCookieNoticeSeen()).not.toThrow();
  });
});
