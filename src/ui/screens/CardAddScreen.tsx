import { useCardAddViewModel } from "@/core/viewmodels/useAccountViewModel";
import { PageBar } from "../layout/PageBar";
import { LinkRow } from "../primitives/LinkRow";

export function CardAddScreen() {
  const vm = useCardAddViewModel();

  return (
    <div className="onboarding-page card-add-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Card options" />

      <section className="activity-intro">
        <h1>Open something new</h1>
        <p>{vm.intro}</p>
      </section>

      <div className="control-list">
        {vm.options.map((option) => (
          <LinkRow
            key={option.id}
            icon={option.icon}
            title={option.title}
            detail={option.detail}
            onClick={() => vm.choose(option.id)}
          />
        ))}
      </div>
    </div>
  );
}
