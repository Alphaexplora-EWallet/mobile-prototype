import type { Biller } from "@/core/domain/payments";
import { Icon } from "./Icon";
import { LinkRow } from "./LinkRow";

/**
 * A biller catalog row: the pay action plus a favorite toggle. The toggle is a
 * sibling of the row button — a button cannot nest inside a button — and the
 * wrapper stretches both to the shared row height.
 */
export function BillerRow({
  biller,
  favorited,
  onPress,
  onToggleFavorite,
}: {
  biller: Biller;
  favorited: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="biller-row">
      <LinkRow icon={biller.icon} title={biller.name} detail={biller.detail} meta={biller.due} onClick={onPress} />
      <button
        type="button"
        className={favorited ? "favorite-toggle is-active" : "favorite-toggle"}
        aria-pressed={favorited}
        aria-label={`${favorited ? "Remove" : "Add"} ${biller.name} ${favorited ? "from" : "to"} favorites`}
        onClick={onToggleFavorite}
      >
        <Icon name={favorited ? "star-filled" : "star"} />
      </button>
    </div>
  );
}
