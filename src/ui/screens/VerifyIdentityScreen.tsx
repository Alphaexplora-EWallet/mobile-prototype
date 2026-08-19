import { useVerifyIdentityViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function VerifyIdentityScreen() {
  const vm = useVerifyIdentityViewModel();

  return (
    <div className="onboarding-page auth-page">
      <PageBar title={vm.title} optionsLabel="Verification options" />

      <section className="confirm-hero">
        <span className="confirm-lock">
          <Icon name="shield" />
        </span>
        <h1>{vm.title}</h1>
        <p>{vm.intro}</p>
      </section>

      <ul className="verify-benefits" aria-label="What verification unlocks">
        {vm.benefits.map((benefit) => (
          <li key={benefit}>
            <Icon name="check" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={vm.verify}>
          {vm.verifyLabel}
        </button>
        <button className="text-button" type="button" onClick={vm.later}>
          {vm.laterLabel}
        </button>
      </div>
    </div>
  );
}
