// Borradores locales de los formularios de campo (C3, opción A): lo capturado,
// foto incluida, queda en IndexedDB de este dispositivo para no perderlo si
// falla el envío, se recarga la página o vence la sesión.
//
// - Por usuario: la clave es `${userId}:${formulario}` y solo se leen los del
//   usuario con sesión (hay celulares compartidos).
// - Duran 7 días desde que se crean (no desde la última edición): la clave de
//   idempotencia del API también dura 7 días y se crea después, al enviar, así
//   que un borrador nunca dura más que su clave.
// - Sin IndexedDB (modo privado, datos bloqueados) todo es un no-op.

export const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const DB_NAME = "hallazgos-borradores";
const STORE = "drafts";
const BY_USER = "userId";

/**
 * Estado del último envío del borrador:
 * - none: no se ha enviado (o falló por un error de datos y se puede editar).
 * - pending: se envió y no hubo respuesta (sin conexión, tiempo agotado).
 * - unconfirmed: el servidor falló (500); pudo haberse guardado.
 * Con pending o unconfirmed el borrador queda en solo lectura.
 */
export type DraftSendState = "none" | "pending" | "unconfirmed";

export interface DraftRecord<T = Record<string, string>> {
  id: string;
  userId: number;
  form: string;
  fields: T;
  photo: Blob | null;
  photoName: string | null;
  photoType: string | null;
  idempotencyKey: string | null;
  sendState: DraftSendState;
  lastSendAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const draftId = (userId: number, form: string) => `${userId}:${form}`;

export const isExpired = (
  draft: Pick<DraftRecord, "createdAt">,
  now = Date.now(),
) => now - Date.parse(draft.createdAt) > DRAFT_TTL_MS;

let dbPromise: Promise<IDBDatabase | null> | null = null;

const openDb = () => {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore(STORE, {
          keyPath: "id",
        });
        store.createIndex(BY_USER, BY_USER);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
};

const run = async <R>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<R> | void,
): Promise<R | undefined> => {
  const db = await openDb();
  if (!db) return undefined;

  return new Promise<R | undefined>((resolve) => {
    try {
      const transaction = db.transaction(STORE, mode);
      const request = operation(transaction.objectStore(STORE));
      transaction.oncomplete = () =>
        resolve(request ? request.result : undefined);
      transaction.onerror = () => resolve(undefined);
      transaction.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
};

/** Borrador vigente del usuario para ese formulario (los vencidos se borran). */
export const getDraft = async <T>(userId: number, form: string) => {
  const draft = await run<DraftRecord<T> | undefined>("readonly", (store) =>
    store.get(draftId(userId, form)),
  );
  if (!draft) return null;
  if (isExpired(draft)) {
    await deleteDraft(userId, form);
    return null;
  }
  return draft;
};

export const putDraft = <T>(draft: DraftRecord<T>) =>
  run("readwrite", (store) => store.put(draft)).then(() => undefined);

export const deleteDraft = (userId: number, form: string) =>
  run("readwrite", (store) => store.delete(draftId(userId, form))).then(
    () => undefined,
  );

/** Borradores vigentes del usuario (aviso al cerrar sesión o al terminar). */
export const listUserDrafts = async (userId: number) =>
  (
    (await run<DraftRecord[]>("readonly", (store) =>
      store.index(BY_USER).getAll(userId),
    )) ?? []
  ).filter((draft) => !isExpired(draft));

/** Al cerrar sesión a propósito: no deja datos del usuario en el celular. */
export const deleteUserDrafts = async (userId: number) => {
  const drafts = await run<IDBValidKey[]>("readonly", (store) =>
    store.index(BY_USER).getAllKeys(userId),
  );
  if (!drafts?.length) return;
  await run("readwrite", (store) => {
    drafts.forEach((key) => store.delete(key));
  });
};

/** Borra los vencidos de cualquier usuario (al abrir la app). */
export const purgeExpiredDrafts = async (now = Date.now()) => {
  const drafts = await run<DraftRecord[]>("readonly", (store) =>
    store.getAll(),
  );
  const expired = (drafts ?? []).filter((draft) => isExpired(draft, now));
  if (!expired.length) return;
  await run("readwrite", (store) => {
    expired.forEach((draft) => store.delete(draft.id));
  });
};
