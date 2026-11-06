import { useState } from 'react';
import { completeNewPassword, confirmForgotPassword, forgotPassword, signIn } from '../auth.js';

/** Écrans : connexion → (nouveau mot de passe) ; ou mot de passe oublié → code + nouveau mot de passe. */
export default function Login() {
  const [step, setStep] = useState('signin'); // signin | newPassword | forgot | reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const run = (fn) => async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const go = (next, message = '') => {
    setStep(next);
    setError('');
    setInfo(message);
  };

  const onSignIn = run(async () => {
    const res = await signIn(email.trim(), password);
    if (res.challenge) {
      setChallenge(res.challenge);
      go('newPassword', 'Première connexion : choisissez votre mot de passe personnel.');
    }
  });

  const onNewPassword = run(() => completeNewPassword(challenge, newPassword));

  const onForgot = run(async () => {
    await forgotPassword(email.trim());
    go('reset', 'Si ce compte existe, un code de vérification vient d’être envoyé par e-mail.');
  });

  const onReset = run(async () => {
    await confirmForgotPassword(email.trim(), code, newPassword);
    setPassword('');
    setNewPassword('');
    go('signin', 'Mot de passe modifié : vous pouvez vous connecter.');
  });

  const passwordRules = 'Au moins 12 caractères, avec majuscules, minuscules et chiffres.';

  return (
    <div className="adm-login">
      <div className="adm-login__card">
        <img src="/images/logo/logo-128.png" alt="" width="56" height="56" />
        <h1>Espace admin</h1>
        <p className="adm-login__sub">AWS User Group Congo-Kinshasa</p>

        {info && <p className="adm-login__info">{info}</p>}
        {error && (
          <p className="adm-login__error" role="alert">
            {error}
          </p>
        )}

        {step === 'signin' && (
          <form onSubmit={onSignIn} className="adm-login__form">
            <label>
              E-mail
              <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Mot de passe
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : 'Se connecter'}
            </button>
            <button type="button" className="adm-link" onClick={() => go('forgot')}>
              Mot de passe oublié ?
            </button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={onNewPassword} className="adm-login__form">
            <label>
              Nouveau mot de passe
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <small className="adm-hint">{passwordRules}</small>
            </label>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : 'Enregistrer et se connecter'}
            </button>
          </form>
        )}

        {step === 'forgot' && (
          <form onSubmit={onForgot} className="adm-login__form">
            <label>
              E-mail du compte
              <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : 'Recevoir un code'}
            </button>
            <button type="button" className="adm-link" onClick={() => go('signin')}>
              Retour à la connexion
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={onReset} className="adm-login__form">
            <label>
              Code reçu par e-mail
              <input className="input" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
            </label>
            <label>
              Nouveau mot de passe
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <small className="adm-hint">{passwordRules}</small>
            </label>
            <button className="btn btn--primary btn--block" disabled={busy}>
              {busy ? <span className="spinner" /> : 'Changer le mot de passe'}
            </button>
            <button type="button" className="adm-link" onClick={() => go('signin')}>
              Retour à la connexion
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
