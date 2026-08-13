import { Icon } from "../primitives/Icon";
import { useSignUpDetailsViewModel } from "@/core/viewmodels/useSignUpViewModel";
import { PageBar } from "../layout/PageBar";

export function SignUpDetailsScreen() {
  const vm = useSignUpDetailsViewModel();

  return (
    <div className="onboarding-page sign-in-page">
      <PageBar title="Sign up" onBack={vm.back} optionsLabel="Sign-up options" />

      <section className="sign-in-copy">
        <p className="eyebrow">Almost there</p>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
      </section>

      <div className="auth-form">
        <label>
          <span>Full name</span>
          <span className="input-shell">
            <Icon name="user" />
            <input
              type="text"
              autoComplete="name"
              placeholder="Maria Clara Dela Cruz"
              aria-label="Full name"
              value={vm.fullName}
              onChange={(event) => vm.setFullName(event.target.value)}
            />
          </span>
        </label>
        <label>
          <span>Email address (optional)</span>
          <span className="input-shell">
            <Icon name="mail" />
            <input
              type="email"
              autoComplete="email"
              placeholder="maria@example.ph"
              aria-label="Email address"
              value={vm.email}
              onChange={(event) => vm.setEmail(event.target.value)}
            />
          </span>
        </label>
      </div>

      {vm.error && (
        <p className="transfer-error" role="alert">
          {vm.error}
        </p>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={vm.continue}>
          Continue
        </button>
      </div>
    </div>
  );
}
