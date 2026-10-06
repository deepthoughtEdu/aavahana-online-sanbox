// app/lib/api/error-messages.ts
//
// Turn whatever the backend hands back on a failed request into a sentence a
// person can act on, so no screen ever shows a bare status code.
//
// Three separate things were leaking codes into the UI:
//
//  1. NodeBB sends login failures as `res.status(403).send('[[error:...]]')` —
//     see backend `src/controllers/authentication.js` → `continueLogin()`. That
//     is `.send(string)`, so the body is text/html, NOT JSON. The api client
//     called `response.json()`, the parse threw, and the catch fell back to
//     `HTTP ${status}: ${statusText}` — which is why a wrong password read as
//     "HTTP 403: Forbidden" instead of "Incorrect email or password."
//
//  2. When the body DID parse, the message was often the raw i18n key
//     (`[[error:invite-expired]]`) or a bare slug (`not-authorised`). NodeBB's
//     own templates resolve those through its translator; this app does not.
//
//  3. Gateway failures (the BFF proxy can't reach NodeBB, a Vercel function
//     times out) return an HTML error page, which again produced
//     "HTTP 502: Bad Gateway".
//
// The i18n keys are resolved HERE rather than at the BFF proxy on purpose:
// `nodebb-labels.ts` deliberately leaves `[[error:...]]` alone because a few
// screens parse those keys (the HC profile validator lists failing JSON paths).
// Those screens keep reading `ApiError.rawMessage`; everything else gets the
// sentence.

/**
 * Keys whose auto-generated text would read badly, be misleading, or leak
 * mechanism. Anything not listed here still gets a readable fallback from
 * `deslugify`, so this map only has to cover what benefits from real wording.
 *
 * Sourced from the backend's `public/language/en-GB/error.json` plus the
 * pdgms-specific keys thrown under `src/pdgms/`.
 */
const ERROR_KEY_MESSAGES: Record<string, string> = {
  // --- Sign-in -------------------------------------------------------------
  // Deliberately identical for bad-user and bad-password: saying which one was
  // wrong tells an attacker which emails are registered.
  'invalid-login-credentials': 'Incorrect email or password. Please try again.',
  'invalid-email': 'We could not find an account with that email address.',
  'invalid-username': 'We could not find an account with that username.',
  'invalid-password': 'Incorrect password. Please try again.',
  'no-user': 'We could not find an account with those details.',
  'wrong-login-type-email': 'Please sign in with your email address.',
  'wrong-login-type-username': 'Please sign in with your username.',
  'wrong-login-type-username-email': 'Please sign in with your email address or username.',
  'local-login-disabled': 'Password sign-in is disabled for this account. Please use Google sign-in.',
  'user-banned': 'This account has been suspended. Please contact your administrator.',
  'user-banned-reason': 'This account has been suspended. Reason: %1',
  'account-locked': 'This account is locked for a short while after too many failed attempts. Please try again later.',
  'too-many-login-attempts': 'Too many sign-in attempts. Please wait a few minutes and try again.',
  'email-not-confirmed': 'Please confirm your email address before signing in.',
  'not-logged-in': 'Your session has expired. Please sign in again.',
  'csrf-invalid': 'Your session expired while you were away. Please refresh the page and try again.',

  // --- Sign-up / password --------------------------------------------------
  'email-taken': 'That email address is already registered. Try signing in instead.',
  'username-taken': 'That username is already taken. Please choose another.',
  'password-too-long': 'That password is too long. Please choose a shorter one.',
  'password-required': 'Please enter your password.',
  'current-password-required': 'Please enter your current password.',
  'new-password-required': 'Please enter a new password.',
  'change-password-error': 'We could not change your password. Please check the details and try again.',
  'reset-code-not-valid': 'That reset code is not valid or has already been used.',

  // --- Invitations ---------------------------------------------------------
  'invite-not-found': 'This invitation link is not valid. Please use the link from your invitation email.',
  'invite-expired': 'This invitation has expired. Please ask your administrator for a new one.',
  'invite-revoked': 'This invitation has been withdrawn. Please contact your administrator.',
  'invite-already-used': 'This invitation has already been used. Try signing in instead.',
  'invite-not-pending': 'This invitation is no longer open. Try signing in instead.',
  'invite-not-accepted': 'Please accept your invitation before continuing.',
  'invite-uid-mismatch': 'This invitation belongs to a different account. Sign out and use the account it was sent to.',
  'token-required': 'This link is missing its invitation code. Please use the link from your invitation email.',
  'invalid-token': 'This link is not valid or has expired.',
  'share-link-expired': 'This link has expired.',
  'shared-page-expired': 'This link has expired.',

  // --- Permissions & context ----------------------------------------------
  'no-privileges': 'You do not have permission to do this.',
  'not-authorised': 'You do not have permission to do this.',
  'organization-context-required': 'We could not tell which organisation you are working in. Please refresh the page and try again.',
  'not-a-member-of-this-org': 'You are not a member of this organisation.',
  'not-an-employee-of-this-org': 'You are not listed as an employee of this organisation.',

  // --- CRM dialler ---------------------------------------------------------
  // These are refusals a ANALYST reads, usually mid-call, and every one of them has
  // something the rep can do about it — so each says the action, not the rule. They were
  // unmapped until 2026-08-22 and reached reps as a deslugified key: "Commitment needs a
  // mode" happened to read like English, which is the only reason nobody reported it.
  // Kept identical to the backend's error.json so the same sentence appears whichever
  // side renders it.
  'commitment-needs-date-and-time': 'Add the date and time they agreed to before logging this as a Commitment.',
  'commitment-must-be-in-the-future': 'That time has already passed. Check the year, then enter the time they agreed to.',
  'commitment-needs-a-mode': 'Choose how the meeting will happen, phone or GMeet, before logging this as a Commitment.',
  'call-duration-required': 'How long was the call? A connected call needs its length.',
  'consent-needs-a-channel': 'Record which channel they agreed to, WhatsApp or email, before logging a consent.',
  // A text logged as an interaction (2026-09-23). Same sentences as the backend's error.json.
  'message-needs-a-prior-call': 'A text can only be logged after a call. Log the first call on this contact, then the text.',
  'message-needs-proof': 'A text needs proof. Add a screenshot of the exchange, or type their reply with the time they sent it.',
  'message-reply-needs-time': 'Add the time they sent that reply.',
  'message-reply-time-out-of-range': 'That reply time is before the previous interaction or in the future. Check the date and time.',
  'message-reply-too-long': 'The typed reply is too long. Keep it to their actual words.',
  'message-proof-too-many': 'Up to three screenshots per text.',
  'message-proof-not-an-image': 'Proof must be an image: PNG, JPG, WebP or HEIC.',
  'message-proof-too-large': 'That screenshot is over 8 MB. Crop or compress it and try again.',
  'message-proof-not-found': 'That proof is not on this message.',
  'message-needs-a-text-status': 'Pick Text under Message status to log a message.',
  'outcome-not-allowed-for-message': 'That outcome cannot be logged on a text. Pick one of the outcomes offered.',
  'proof-only-on-a-message': 'Proof can only be added to a text, not to a call.',
  'correction-cannot-change-medium': 'A correction can change what happened, not whether it was a call or a text.',
  'proof-not-live': 'That proof has already been replaced.',
  'proof-last-live': 'A text must keep at least one proof. Add a replacement instead of removing this one.',
  'proof-replace-needs-reason': 'Say why this proof is being replaced, in a few words.',
  'cloudinary-not-configured': 'Screenshot storage is not set up on this server yet. Type their reply with its time instead, or ask an admin.',
  'allocate-again-needs-a-reason': 'Say why you are giving up this number. Your manager reads this before issuing a fresh one.',
  'follow-up-date-required': 'This outcome needs a follow-up date.',
  'follow-up-date-out-of-range': 'A follow-up date can be at most three days out. Use the prospect\'s own date for anything later.',
  'pull-contact-unassigned': 'Nobody holds this contact, so there is nothing to pull. Allocate it from the bank instead.',
  'call-on-others-ledger-no-scheduling': 'This contact is on a colleague\'s ledger. You can log the call, but a callback, cool-down or meeting date needs the contact on your own ledger first.',
  'call-on-others-ledger-limited': 'This contact is on a colleague\'s ledger. You can log what happened, but a disposition that parks, closes or returns the contact needs it on your own ledger first.',
  'crm-no-org-llm-key': 'No model key is set for this organisation. A manager adds one under Spotlights → AI config.',
  'crm-call-brief-nothing-to-read': 'None of the calls with this company has a transcript or a remark yet, so there is nothing to write a brief from.',
  'crm-call-brief-unreadable': 'The model did not answer in the expected shape. Try once more; if it repeats, the key or model may be wrong.',
  'send-message-empty': 'Write the message before sending.',
  'send-message-too-long': 'The message is too long. Keep it under 4,000 characters.',
  'send-message-needs-link': 'Keep {{link}} in the message. Each recipient gets their own link there.',
  'send-message-needs-passcode': 'Keep {{passcode}} in the message. The page cannot be opened without it.',
  'send-number-not-on-contact': 'That number is not on this contact, or it has been struck as invalid. Add it to the contact first, then choose it here.',
  'send-address-not-on-contact': 'That address is not on this contact. Add it to the contact first, then choose it here.',
  'send-confirmation-mismatch': 'The name you typed does not match. Type the prospect\'s name for one recipient, or the company\'s name for several.',
  'whatsapp-api-not-configured': 'WhatsApp through the API is not configured for this organisation. Send from your own WhatsApp instead.',
  'whatsapp-template-not-configured': 'WhatsApp credentials exist, but no approved message template is set, so the API channel stays off.',
  'whatsapp-recipient-required': 'Enter a number that can be dialled.',
  'crm-roles-invalid-level': 'Pick member, manager or leader.',
  'crm-roles-unknown-user': 'That entry does not match anyone in the organisation, so it can only be removed.',
  'crm-roles-last-leader': 'That would leave the organisation without a leader. Make somebody else a leader first.',
  'crm-roles-last-leader-self': 'You are the only leader. Make somebody else a leader before stepping down.',
  'user-not-member': 'That person is not a member of this organisation, so no employment record can be made for them.',
  'consented-contact-admin-end-only': 'This contact has an open consent. It stays open until an admin ends it; transfer it instead of closing it.',
  'contact-not-consented': 'This contact has never consented.',
  'invalid-phone-number': 'That number is not on this contact.',
  'phone-role-needs-a-live-number': 'That number is marked invalid, so it cannot be the number to reach them on.',
  'outcome-required-for-connected-call': 'A connected call needs an outcome. Say what came of it.',

  // --- CRM outreach: queue, bank, books, transfers, offering moves ---------
  // Same defect as the block above, found 2026-09-01 when an analyst's Dialler refused to
  // load and told her only "Some of the details sent were not valid" - the STATUS_MESSAGES[400]
  // fallback. Thirty codes the CRM throws were unmapped, so every one of them reached the rep
  // as that sentence and no one on the floor could tell what had actually gone wrong.
  // Where the backend's error.json already has a sentence, it is copied verbatim.
  'agent-not-assigned-to-offering': 'You are not an enabled analyst on this offering. Ask your manager to add you, or switch to the offering your numbers were given on.',
  'contact-not-found': 'Contact not found.',
  'company-not-found': 'Company not found.',
  'call-log-not-found': 'That call log no longer exists. Reload the page.',
  'follow-up-task-not-found': 'That follow-up no longer exists. Reload the page.',
  'offering-not-found': 'That offering does not exist in this organisation.',
  'contact-is-dnd': 'This contact is marked Do Not Disturb. They cannot be assigned or called.',
  'contact-is-terminal': 'This contact is closed. Reopen them before assigning or calling.',
  'contact-not-yours': 'This contact is not in your queue.',
  'invalid-channel': 'Choose a valid channel before sending.',

  // Books: the staging area between an upload and the Number Bank.
  'contact-book-not-found': 'That book no longer exists. Reload the Upload page.',
  'contact-book-already-pushed': 'This book is already in the Number Bank. It cannot be pushed twice.',
  'contact-book-not-pushed': 'This book has not been pushed to the Number Bank yet.',
  'contact-book-not-withdrawn': 'This book is still live. Withdraw it before doing this.',

  // Handovers between analysts.
  'contact-not-transferable': 'This contact cannot be handed on: it is terminal, withdrawn, DND or blocked.',
  'transfer-note-required': 'Say why. A move without a reason cannot be audited.',
  'transfer-already-pending': 'This contact already has a handover waiting on the other person.',
  'transfer-contact-moved': 'This contact moved while the handover was in flight. Reload and try again.',
  'transfer-stage-not-allowed': 'The person you are handing this to cannot work contacts at this stage.',
  'transfer-to-self': 'You already hold this contact.',

  // Asking a manager for a replacement number.
  'outreach-request-not-found': 'That request no longer exists. Reload the page.',
  'outreach-request-not-pending': 'That request has already been dealt with.',

  // Moving a contact from one offering to another.
  'offering-move-same-offering': 'The contact is already on that offering.',
  'offering-move-target-not-found': 'That offering does not exist in this organisation.',
  'offering-move-scheduled': 'This contact has a future meeting or a demanded follow-up on this offering. Honour or clear it before moving them.',
  'offering-move-open-deal': 'This contact anchors an open deal on this offering. Close or lose the deal before moving them.',
  'offering-move-duplicate': 'The target offering already has a live contact with this number.',
  'offering-move-conflict': 'The contact changed state while the move was in flight. Reload and try again.',

  // Adding or correcting a number on a contact.
  'phone-already-on-contact': 'That number is already on this contact.',
  'phone-belongs-to-another-contact': 'That number is already on a different contact. Check which of the two it belongs to before adding it.',
  'referred-contact-phone-exists': 'A contact with this phone number already exists. Search for them instead of adding a duplicate.',

  // --- Generic -------------------------------------------------------------
  'invalid-data': 'Some of the details sent were not valid. Please check them and try again.',
  'not-found': 'We could not find what you were looking for.',
  'required-parameters-missing': 'Some required details were missing: %1',
};

/**
 * What to say when the response body told us nothing usable. Keyed by HTTP
 * status; `0` means the request never reached a server at all.
 */
const STATUS_MESSAGES: Record<number, string> = {
  0: 'We could not reach the server. Check your internet connection and try again.',
  400: 'Some of the details sent were not valid. Please check them and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do this.',
  404: 'We could not find what you were looking for.',
  408: 'That request took too long. Please try again.',
  409: 'That conflicts with something that already exists.',
  413: 'That file is too large to upload.',
  422: 'Some of the details sent were not valid. Please check them and try again.',
  429: 'Too many attempts. Please wait a moment and try again.',
  500: 'Something went wrong on our end. Please try again in a moment.',
  502: 'The service is temporarily unavailable. Please try again in a moment.',
  503: 'The service is temporarily unavailable. Please try again in a moment.',
  504: 'The service took too long to respond. Please try again in a moment.',
};

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

/** `[[error:invite-expired]]` / `[[error:user-banned-reason, spam]]` */
const I18N_KEY_PATTERN = /\[\[([a-z0-9_-]+):([a-z0-9._-]+)((?:,[^\]]*)?)\]\]/gi;

/** A lone machine token like `not-authorised` or `invite_expired`. */
const BARE_SLUG_PATTERN = /^[a-z][a-z0-9]*(?:[-_][a-z0-9]+)+$/;

/** What the api client used to produce: "HTTP 502: Bad Gateway". */
const HTTP_CODE_PATTERN = /^HTTP\s+\d{3}\b/i;

/** Longest body we will consider quoting back to the user verbatim. */
const MAX_RAW_BODY_LENGTH = 300;

/** `invite-expired` → `Invite expired`. Last resort for an unmapped key. */
function deslugify(key: string): string {
  const words = key.replace(/[-_.]+/g, ' ').trim();
  if (!words) return '';
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Substitute NodeBB's positional `%1`, `%2`… placeholders. */
function applyArgs(template: string, args: string[]): string {
  return template.replace(/%(\d+)/g, (whole, index: string) => {
    const arg = args[Number(index) - 1];
    return arg === undefined ? whole : arg;
  });
}

/**
 * Resolve a single i18n key to its sentence. `namespace:key` wins over `key`
 * so a future collision between two namespaces can be disambiguated.
 */
function messageForKey(namespace: string, key: string, args: string[]): string {
  const template = ERROR_KEY_MESSAGES[`${namespace}:${key}`] ?? ERROR_KEY_MESSAGES[key];
  if (template) return applyArgs(template, args);
  // Unmapped key: the de-slugified form still reads as English, and keeping the
  // detail beats swallowing it into a generic message.
  const human = deslugify(key);
  return args.length ? `${human}: ${args.join(', ')}` : human;
}

/** True when a string is an HTML document rather than a message. */
function isHtml(value: string): boolean {
  const head = value.slice(0, 200).toLowerCase();
  return head.startsWith('<') || head.includes('<!doctype') || head.includes('<html');
}

/**
 * Convert one candidate string into something worth showing, or `null` if it
 * carries no meaning for a human (empty, an HTML page, a bare status line).
 *
 * Exported for the toast formatter in `with-guard.ts`, which runs every error
 * message — including ones from plain `Error`s that never touched the api
 * client — through this last gate.
 */
export function humanizeErrorMessage(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (isHtml(trimmed)) return null;
  if (HTTP_CODE_PATTERN.test(trimmed)) return null;
  if (trimmed.length > MAX_RAW_BODY_LENGTH) return null;

  // Resolve every embedded i18n key. A message can carry trailing detail after
  // the key (the HC profile validator appends failing JSON paths), so replace
  // in place rather than matching the whole string.
  let resolved = trimmed;
  if (trimmed.includes('[[')) {
    resolved = trimmed
      .replace(I18N_KEY_PATTERN, (_whole, namespace: string, key: string, rest: string) => {
        const args = rest
          ? rest.replace(/^,/, '').split(',').map((a) => a.trim()).filter(Boolean)
          : [];
        return messageForKey(namespace.toLowerCase(), key.toLowerCase(), args);
      })
      .trim();

    // The body was nothing but an unresolvable key fragment.
    if (!resolved || resolved.includes('[[')) return null;
    return resolved;
  }

  // A bare machine slug with no brackets — NodeBB emits these too
  // (`not-authorised`, `invalid-session`).
  if (BARE_SLUG_PATTERN.test(resolved)) {
    return ERROR_KEY_MESSAGES[resolved] ?? deslugify(resolved);
  }

  return resolved;
}

/** The shape of an error body, as far as we are willing to assume anything. */
type UnknownBody = {
  status?: { code?: string; message?: string } | string;
  error?: unknown;
  message?: unknown;
  errors?: Array<{ field?: string; message?: string }>;
  response?: { retryAfter?: unknown };
};

/**
 * Pull every string out of an error body that could plausibly be the message,
 * most specific first.
 */
function candidatesFromBody(body: unknown): string[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as UnknownBody;
  const out: string[] = [];

  // Field-level validation detail is the most useful thing we can say.
  if (Array.isArray(b.errors)) {
    const joined = b.errors
      .map((e) => e?.message)
      .filter((m): m is string => typeof m === 'string' && m.trim().length > 0)
      .join('. ');
    if (joined) out.push(joined);
  }

  // NodeBB's envelope: { status: { code, message }, response: {...} }.
  if (b.status && typeof b.status === 'object' && typeof b.status.message === 'string') {
    out.push(b.status.message);
  }
  if (typeof b.error === 'string') out.push(b.error);
  if (typeof b.message === 'string') out.push(b.message);

  return out;
}

export interface ResolveErrorInput {
  /** HTTP status, or 0 when the request never reached a server. */
  status: number;
  /** HTTP status text, used only for logging context. */
  statusText?: string;
  /** The parsed response body, when it was valid JSON. */
  body?: unknown;
  /** The raw response text, always — NodeBB sends login errors as text/html. */
  rawText?: string;
}

/**
 * The single place a failed request becomes a sentence.
 *
 * Guarantees the result is never a status code, an i18n key, an HTML page, or
 * an empty string: when nothing usable comes back it falls through to the
 * per-status wording, and finally to a generic sentence.
 */
export function resolveApiErrorMessage({
  status,
  body,
  rawText,
}: ResolveErrorInput): string {
  // BYOK ceilings are shared across AI features. The server tells us exactly
  // when this fixed window expires; surface that action instead of leaking the
  // untranslated NodeBB key or falling back to a generic 429 sentence.
  if (body && typeof body === 'object') {
    const b = body as UnknownBody;
    const upstream = b.status && typeof b.status === 'object' ? b.status.message : undefined;
    if (upstream === '[[error:byok-rate-limit-user-min]]') {
      const rawRetryAfter = Number(b.response?.retryAfter);
      const retryAfter = Number.isFinite(rawRetryAfter) && rawRetryAfter > 0
        ? Math.ceil(rawRetryAfter)
        : 60;
      return `You have reached the AI request limit for this minute. Please try again in ${retryAfter} seconds.`;
    }
  }

  for (const candidate of candidatesFromBody(body)) {
    const human = humanizeErrorMessage(candidate);
    if (human) return human;
  }

  // NodeBB's `res.status(403).send('[[error:invalid-login-credentials]]')` lands
  // here: a text/html body that never parsed as JSON.
  const fromRaw = humanizeErrorMessage(rawText);
  if (fromRaw) return fromRaw;

  return STATUS_MESSAGES[status] ?? GENERIC_MESSAGE;
}

/** Wording for a status with no body at all (used by binary/file requests). */
export function messageForStatus(status: number): string {
  return STATUS_MESSAGES[status] ?? GENERIC_MESSAGE;
}
