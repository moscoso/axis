import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SpellCard } from 'axis-models';
import { SpellIcon } from '../spell-icon/spell-icon';

/**
 * The shared Spell display — face-up Spells either player may cast. Each tile
 * shows its footprint icon, name, and Force cost. Tiles are dimmed when the
 * active player can't afford the cost (Force room) or it isn't their turn.
 */
@Component({
    selector: 'app-spell-display',
    standalone: true,
    imports: [SpellIcon],
    templateUrl: './spell-display.html',
    styleUrls: ['./spell-display.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellDisplay {
    readonly spells = input.required<SpellCard[]>();
    /** Force the active player can spend right now (Rift room). */
    readonly forceRoom = input<number>(0);
    /** Whether casting is available this turn (your turn, main phase, no pending draws). */
    readonly castable = input<boolean>(false);
    readonly selectedId = input<string | null>(null);
    readonly deckSize = input<number>(0);

    readonly spellSelected = output<SpellCard>();

    affordable(spell: SpellCard): boolean {
        return spell.forceCost <= this.forceRoom();
    }

    /** A short ▲-string for the Force cost. */
    cost(spell: SpellCard): string {
        return '▲'.repeat(spell.forceCost);
    }

    isSelected(spell: SpellCard): boolean {
        return this.selectedId() === spell.id;
    }

    onPick(spell: SpellCard): void {
        if (this.castable() && this.affordable(spell)) {
            this.spellSelected.emit(spell);
        }
    }
}
