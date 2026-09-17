"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

const FORM_ENDPOINT = "https://mail.estudioideamos.com/contact/send.php";
const MIN_COMPLETION_TIME_MS = 2_500;
const SUBMISSION_COOLDOWN_MS = 60_000;
const DUPLICATE_WINDOW_MS = 10 * 60_000;
const SUBMISSION_STORAGE_KEY = "ideamos.internacional.contact.recent-submission";

type FormStatus = "idle" | "sending" | "success" | "error";
type RecentSubmission = { fingerprint: string; submittedAt: number };
type ChallengeResponse = { ok?: boolean; challenge?: string };

function fingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function getRecentSubmission(): RecentSubmission | null {
  try {
    const stored = window.localStorage.getItem(SUBMISSION_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<RecentSubmission>;
    if (typeof parsed.fingerprint !== "string" || typeof parsed.submittedAt !== "number") return null;
    return { fingerprint: parsed.fingerprint, submittedAt: parsed.submittedAt };
  } catch {
    return null;
  }
}

function saveRecentSubmission(submission: RecentSubmission) {
  try {
    window.localStorage.setItem(SUBMISSION_STORAGE_KEY, JSON.stringify(submission));
  } catch {
    // Private browsing or strict storage settings must not block the form.
  }
}

export default function ContactLeadForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [feedback, setFeedback] = useState("");
  const [challenge, setChallenge] = useState("");
  const startedAt = useRef(0);

  const requestChallenge = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(`${FORM_ENDPOINT}?challenge=1`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal,
      });
      const result = await response.json() as ChallengeResponse;
      if (!response.ok || result.ok !== true || typeof result.challenge !== "string") return false;
      setChallenge(result.challenge);
      startedAt.current = Date.now();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void requestChallenge(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestChallenge]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const now = Date.now();
    const formData = new FormData(form);
    const honeypot = String(formData.get("_gotcha") ?? "").trim();

    // Silently accept bot-filled honeypots without contacting the mail server.
    if (honeypot) {
      form.reset();
      startedAt.current = now;
      setStatus("success");
      setFeedback("Recibimos tu consulta. Nuestro equipo te responderá a la brevedad para dar el próximo paso.");
      return;
    }

    const elapsed = now - startedAt.current;
    if (elapsed < MIN_COMPLETION_TIME_MS) {
      setStatus("error");
      setFeedback("Esperá unos segundos y volvé a enviar la consulta.");
      return;
    }

    if (!challenge) {
      setStatus("error");
      setFeedback("Estamos actualizando la protección del formulario. Esperá unos segundos y volvé a intentar.");
      void requestChallenge();
      return;
    }

    const payload = ["nombre", "empresa", "email", "telefono", "mensaje"]
      .map((field) => String(formData.get(field) ?? "").trim().toLowerCase())
      .join("\u001f");
    const payloadFingerprint = fingerprint(payload);
    const recentSubmission = getRecentSubmission();

    if (recentSubmission && now - recentSubmission.submittedAt < DUPLICATE_WINDOW_MS && recentSubmission.fingerprint === payloadFingerprint) {
      setStatus("success");
      setFeedback("Esta consulta ya fue enviada. Te responderemos a la brevedad.");
      return;
    }

    if (recentSubmission && now - recentSubmission.submittedAt < SUBMISSION_COOLDOWN_MS) {
      const seconds = Math.ceil((SUBMISSION_COOLDOWN_MS - (now - recentSubmission.submittedAt)) / 1_000);
      setStatus("error");
      setFeedback(`Esperá ${seconds} segundos antes de enviar otra consulta.`);
      return;
    }

    formData.set("_form_started_at", String(startedAt.current));
    formData.set("_form_elapsed_ms", String(elapsed));
    formData.set("_form_challenge", challenge);
    formData.set("_page_url", window.location.href);
    setStatus("sending");
    setFeedback("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const result = await response.json();
      if (!response.ok || result.ok !== true) throw new Error("Form submission failed");
      saveRecentSubmission({ fingerprint: payloadFingerprint, submittedAt: Date.now() });
      form.reset();
      setChallenge("");
      void requestChallenge();
      setStatus("success");
      setFeedback("Recibimos tu consulta. Nuestro equipo te responderá a la brevedad para dar el próximo paso.");
    } catch {
      setChallenge("");
      void requestChallenge();
      setStatus("error");
      setFeedback("No pudimos enviar la consulta. Intentá nuevamente o escribinos por WhatsApp.");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return <form
    action={FORM_ENDPOINT}
    method="POST"
    onSubmit={handleSubmit}
    aria-busy={status === "sending"}
  >
    <input type="hidden" name="origen" value="Sitio web Ideamos Internacional" />
    <label className="contact-honeypot" aria-hidden="true">
      No completar
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
    </label>
    <div>
      <label>Nombre<input required minLength={2} maxLength={80} type="text" name="nombre" placeholder="Tu nombre" autoComplete="name"/></label>
      <label>Empresa<input maxLength={120} type="text" name="empresa" placeholder="Nombre de tu empresa" autoComplete="organization"/></label>
    </div>
    <div>
      <label>Email<input required maxLength={254} type="email" name="email" placeholder="nombre@empresa.com" autoComplete="email"/></label>
      <label>Teléfono<input required minLength={8} maxLength={30} pattern="[0-9+() -]{8,30}" type="tel" name="telefono" placeholder="+54" autoComplete="tel" inputMode="tel"/></label>
    </div>
    <label>Mensaje<textarea required minLength={20} maxLength={2000} name="mensaje" rows={4} placeholder="Contanos brevemente sobre tu proyecto"/></label>
    <button className="contact-submit" type="submit" disabled={status === "sending"}>
      {status === "sending" ? "Enviando..." : "Enviar consulta"}
    </button>
    <div className={`contact-form-status is-${status}`} role="status" aria-live="polite" aria-atomic="true">
      {status === "success" ? <>
        <span className="contact-success-icon" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none"><path d="m8 16 5.5 5.5L24 11" pathLength="1" /></svg>
        </span>
        <span className="contact-success-copy">
          <span className="contact-success-label">Mensaje enviado</span>
          <strong>¡Gracias por escribirnos!</strong>
          <span className="contact-success-description">{feedback}</span>
        </span>
      </> : feedback}
    </div>
  </form>;
}
