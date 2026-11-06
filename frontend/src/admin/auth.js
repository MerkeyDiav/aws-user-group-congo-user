/**
 * Connexion à l'espace admin via Amazon Cognito (appels directs à l'API Cognito, sans bibliothèque).
 *
 * - USER_PASSWORD_AUTH : e-mail + mot de passe (envoyés en HTTPS à Cognito uniquement)
 * - NEW_PASSWORD_REQUIRED : première connexion avec le mot de passe temporaire reçu par e-mail
 * - REFRESH_TOKEN_AUTH : la session est prolongée automatiquement (30 jours sans reconnexion)
 */
const REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-2';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const STORAGE_KEY = 'awsug-admin-session';

const MESSAGES = {
  NotAuthorizedException: 'E-mail ou mot de passe incorrect.',
  UserNotFoundException: 'E-mail ou mot de passe incorrect.',
  PasswordResetRequiredException: 'Un nouveau mot de passe est requis : utilisez « Mot de passe oublié ».',
  InvalidPasswordException:
    'Mot de passe trop faible : au moins 12 caractères, avec majuscules, minuscules et chiffres.',
  CodeMismatchException: 'Code de vérification incorrect.',
  ExpiredCodeException: 'Ce code a expiré : demandez-en un nouveau.',
  LimitExceededException: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  TooManyRequestsException: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  TooManyFailedAttemptsException: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
};

async function cognito(action, body) {
  if (!CLIENT_ID) throw new Error('Configuration manquante : VITE_COGNITO_CLIENT_ID.');
  let res;
  try {
    res = await fetch(`https://cognito-idp.${REGION}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify({ ClientId: CLIENT_ID, ...body }),
    });
  } catch {
    throw new Error('Connexion impossible. Vérifiez votre accès à Internet.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = String(data.__type || '').split('#').pop();
    const err = new Error(MESSAGES[code] || data.message || 'Erreur de connexion.');
    err.code = code;
    throw err;
  }
  return data;
}

/** Lit le contenu d'un jeton JWT (sans le vérifier : c'est le rôle d'API Gateway). */
function decode(token) {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(part))));
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function save(session) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* stockage indisponible : la session ne survivra pas au rechargement */
  }
}

let session = load();
const listeners = new Set();

function setSession(next) {
  session = next;
  save(next);
  listeners.forEach((fn) => fn(next));
}

export function onSessionChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const currentUser = () => (session ? { email: session.email } : null);

function fromAuthResult(result, refreshToken) {
  const claims = decode(result.IdToken);
  return {
    idToken: result.IdToken,
    refreshToken: result.RefreshToken || refreshToken,
    expiresAt: claims.exp * 1000,
    email: claims.email,
  };
}

/** Renvoie { challenge } si un nouveau mot de passe est exigé, sinon ouvre la session. */
export async function signIn(email, password) {
  const res = await cognito('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  if (res.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
    return { challenge: { email, session: res.Session } };
  }
  if (!res.AuthenticationResult) throw new Error(`Étape de connexion non prise en charge : ${res.ChallengeName}`);
  setSession(fromAuthResult(res.AuthenticationResult));
  return {};
}

export async function completeNewPassword(challenge, newPassword) {
  const res = await cognito('RespondToAuthChallenge', {
    ChallengeName: 'NEW_PASSWORD_REQUIRED',
    Session: challenge.session,
    ChallengeResponses: { USERNAME: challenge.email, NEW_PASSWORD: newPassword },
  });
  setSession(fromAuthResult(res.AuthenticationResult));
}

export const forgotPassword = (email) => cognito('ForgotPassword', { Username: email });

export const confirmForgotPassword = (email, code, password) =>
  cognito('ConfirmForgotPassword', { Username: email, ConfirmationCode: code.trim(), Password: password });

let refreshing = null;

/** Jeton valide pour appeler l'API admin (renouvelé si besoin), ou null si déconnecté. */
export async function getIdToken({ forceRefresh = false } = {}) {
  if (!session) return null;
  if (!forceRefresh && session.expiresAt - Date.now() > 60_000) return session.idToken;
  refreshing ||= cognito('InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: { REFRESH_TOKEN: session.refreshToken },
  })
    .then((res) => setSession(fromAuthResult(res.AuthenticationResult, session.refreshToken)))
    .catch((err) => {
      if (err.code === 'NotAuthorizedException') setSession(null); // session expirée ou révoquée
      else throw err;
    })
    .finally(() => {
      refreshing = null;
    });
  await refreshing;
  return session?.idToken || null;
}

export async function signOut() {
  const token = session?.refreshToken;
  setSession(null);
  if (token) await cognito('RevokeToken', { Token: token }).catch(() => {});
}
