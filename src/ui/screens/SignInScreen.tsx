import { useState } from "react";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";

export function SignInScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="onboarding-page sign-in-page">
      <header className="centered-app-bar sign-in-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to welcome">
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="sign-in-copy">
        <p className="eyebrow">Welcome back</p>
        <h1>
          Pick up where
          <br />
          you left off
        </h1>
        <p>Your wallet, quests, and money style are waiting.</p>
      </section>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
      >
        <label>
          <span>Email address</span>
          <span className="input-shell">
            <Icon name="mail" />
            <input
              type="email"
              autoComplete="email"
              placeholder="maya@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </span>
        </label>
        <label>
          <span>Password</span>
          <span className="input-shell">
            <Icon name="lock" />
            <input
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((value) => !value)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              <Icon name={passwordVisible ? "eye-off" : "eye"} />
            </button>
          </span>
        </label>
        <button className="forgot-button" type="button">
          Forgot password?
        </button>
        <button className="primary-button" type="submit">
          Sign in
        </button>
      </form>

      <div className="demo-auth">
        <span>Frontend prototype</span>
        <p>No real account or credentials are required.</p>
        <button className="secondary-button" type="button" onClick={onContinue}>
          Continue with demo account
        </button>
      </div>
    </div>
  );
}
