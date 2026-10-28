import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { v4 as uuidv4 } from "uuid";

import { parseApiError } from "@services";
import { useUserSessionStore } from "@store";
import {
  deleteDraft,
  draftId,
  DraftRecord,
  DraftSendState,
  getDraft,
  putDraft,
} from "@shared/drafts/draftStore";

export interface DraftContent<T> {
  fields: T;
  photo: File | null;
}

export interface DraftOffer {
  savedAt: string;
  hasPhoto: boolean;
  sendState: DraftSendState;
  lastSendAt: string | null;
}

export interface DraftLock {
  sendState: Exclude<DraftSendState, "none">;
  lastSendAt: string;
}

interface Options<T> {
  /** Formulario ("nuevo", "cerrar:12"…); null desactiva el borrador. */
  form: string | null;
  content: DraftContent<T>;
  /** Hay algo que valga guardar (no solo lo que el formulario propone). */
  hasContent: (content: DraftContent<T>) => boolean;
  /** Pone en el formulario lo recuperado. */
  onRestore: (content: DraftContent<T>) => void;
}

const AUTOSAVE_MS = 800;

// Errores después de los cuales el envío quizá llegó: el borrador queda en
// solo lectura con la misma clave (ver docs/ux-componentes.md).
const lockStateFor = (error: unknown): DraftLock["sendState"] | null => {
  const { kind } = parseApiError(error);
  if (kind === "offline" || kind === "timeout" || kind === "inProgress") {
    return "pending";
  }
  if (kind === "server") return "unconfirmed";
  return null;
};

// Borrador local de un formulario (C3): se guarda solo mientras se captura,
// se ofrece recuperarlo al volver a abrir el formulario y se borra al enviar
// con éxito. Lleva la clave de idempotencia del envío: reenviar un borrador
// nunca duplica. Si un envío quedó sin respuesta, el borrador queda en solo
// lectura ("Reintentar envío" o "Descartar") para no perder ediciones en
// silencio: si el primero sí se guardó, el API devolvería ese y no las
// ediciones.
//
//   const draft = useFormDraft({ form: "nuevo", content, hasContent, onRestore });
//   await draft.markSending();
//   Service.create(data, { idempotencyKey: draft.key() })
//     .then(() => draft.settle())
//     .catch(draft.settle);
export function useFormDraft<T>({
  form,
  content,
  hasContent,
  onRestore,
}: Options<T>) {
  const userId = useUserSessionStore((state) => state.id);
  const [offerRecord, setOfferRecord] = useState<DraftRecord<T> | null>(null);
  const [lock, setLock] = useState<DraftLock | null>(null);
  // Hasta leer el borrador (y, si hay, hasta que el usuario elija) no se
  // guarda nada: no se pisa lo que se le va a ofrecer.
  const [ready, setReady] = useState(false);

  const keyRef = useRef<string | null>(null);
  const createdAtRef = useRef<string | null>(null);
  const lastSendAtRef = useRef<string | null>(null);
  // Lo último capturado, para guardar sin depender de cada render. Se
  // actualiza antes que los demás efectos.
  const contentRef = useRef(content);
  const hasContentRef = useRef(hasContent);
  useLayoutEffect(() => {
    contentRef.current = content;
    hasContentRef.current = hasContent;
  });

  const reset = () => {
    keyRef.current = null;
    createdAtRef.current = null;
    lastSendAtRef.current = null;
  };

  useEffect(() => {
    let ignore = false;
    setOfferRecord(null);
    setLock(null);
    setReady(false);
    reset();
    if (!form || !userId) return;

    getDraft<T>(userId, form).then((draft) => {
      if (ignore) return;
      if (
        draft &&
        (hasContentRef.current(toContent(draft)) || draft.sendState !== "none")
      ) {
        setOfferRecord(draft);
      } else {
        setReady(true);
      }
    });
    return () => {
      ignore = true;
    };
  }, [form, userId]);

  const save = useCallback(
    async (sendState: DraftSendState) => {
      if (!form || !userId) return;
      const { fields, photo } = contentRef.current;
      const now = new Date().toISOString();
      createdAtRef.current ??= now;
      await putDraft<T>({
        id: draftId(userId, form),
        userId,
        form,
        fields,
        photo,
        photoName: photo?.name ?? null,
        photoType: photo?.type ?? null,
        idempotencyKey: keyRef.current,
        sendState,
        lastSendAt: lastSendAtRef.current,
        createdAt: createdAtRef.current,
        updatedAt: now,
      });
    },
    [form, userId],
  );

  // Guardado automático mientras se captura (no en solo lectura).
  const fieldsKey = JSON.stringify(content.fields);
  useEffect(() => {
    if (!ready || lock || !form || !userId) return;
    const timer = setTimeout(() => {
      if (hasContentRef.current(contentRef.current)) {
        save("none");
      } else if (createdAtRef.current) {
        // Se borró todo lo capturado: ya no hay borrador.
        reset();
        deleteDraft(userId, form);
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [fieldsKey, content.photo, ready, lock, form, userId, save]);

  /**
   * Guarda ya lo capturado, sin esperar al guardado automático (por ejemplo,
   * antes de salir: al desmontar se cancela el que estaba por ocurrir). No
   * pisa un borrador que todavía se está ofreciendo ni uno en solo lectura.
   */
  const flush = async () => {
    if (!ready || lock || !form || !userId) return;
    if (hasContentRef.current(contentRef.current)) await save("none");
  };

  /** Aplica el borrador ofrecido; con envío pendiente, en solo lectura. */
  const restore = () => {
    if (!offerRecord) return;
    keyRef.current = offerRecord.idempotencyKey;
    createdAtRef.current = offerRecord.createdAt;
    lastSendAtRef.current = offerRecord.lastSendAt;
    onRestore(toContent(offerRecord));
    if (offerRecord.sendState !== "none") {
      setLock({
        sendState: offerRecord.sendState,
        lastSendAt: offerRecord.lastSendAt ?? offerRecord.updatedAt,
      });
    }
    setOfferRecord(null);
    setReady(true);
  };

  /** Borra el borrador. Devuelve si estaba en solo lectura (limpiar el form). */
  const discard = async () => {
    const wasLocked = !!lock;
    if (form && userId) await deleteDraft(userId, form);
    reset();
    setOfferRecord(null);
    setLock(null);
    setReady(true);
    return wasLocked;
  };

  /** Clave de idempotencia del envío: la del borrador, o una nueva. */
  const key = () => {
    keyRef.current ??= uuidv4();
    return keyRef.current;
  };

  /** Antes de enviar: queda guardado como envío pendiente con su clave. */
  const markSending = async () => {
    key();
    lastSendAtRef.current = new Date().toISOString();
    setOfferRecord(null);
    setReady(true);
    await save("pending");
  };

  /**
   * Después de enviar. Sin error: se borra. Sin respuesta o error del
   * servidor: solo lectura con la misma clave. Error de datos (4xx): se
   * puede editar y el próximo envío lleva clave nueva.
   */
  const settle = async (error?: unknown) => {
    if (error === undefined) {
      if (form && userId) await deleteDraft(userId, form);
      reset();
      setLock(null);
      return;
    }

    const lockState = lockStateFor(error);
    if (lockState) {
      setLock({
        sendState: lockState,
        lastSendAt: lastSendAtRef.current ?? new Date().toISOString(),
      });
      await save(lockState);
      return;
    }

    keyRef.current = null;
    lastSendAtRef.current = null;
    setLock(null);
    await save("none");
  };

  const offer: DraftOffer | null = offerRecord && {
    savedAt: offerRecord.updatedAt,
    hasPhoto: !!offerRecord.photo,
    sendState: offerRecord.sendState,
    lastSendAt: offerRecord.lastSendAt,
  };

  return { offer, lock, restore, discard, key, markSending, settle, flush };
}

const toContent = <T>(draft: DraftRecord<T>): DraftContent<T> => ({
  fields: draft.fields,
  photo: draft.photo
    ? new File([draft.photo], draft.photoName ?? "evidencia.jpg", {
        type: draft.photoType ?? draft.photo.type,
      })
    : null,
});

export type FormDraft = ReturnType<typeof useFormDraft>;
