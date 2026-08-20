import { useSignUpProfileViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function SignUpProfileScreen() {
  const vm = useSignUpProfileViewModel();

  return (
    <div className="onboarding-page auth-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Sign-up options" />

      <section className="activity-intro">
        <h1>What should we call you?</h1>
        <p>{vm.intro}</p>
      </section>

      <label className="money-note">
        <span className="field-label">Full name</span>
        <span className="input-shell">
          <Icon name="user" />
          <input
            type="text"
            autoComplete="name"
            placeholder="Maya Santos"
            aria-label="Full name"
            value={vm.fullName}
            onChange={(event) => vm.setFullName(event.target.value)}
          />
        </span>
      </label>

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={vm.submit}>
          Continue
        </button>
      </div>
    </div>
  );
}
