import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Card as CardModel, PlayerSide } from 'axis-models';
import { Card } from '../card/card';

@Component({
    selector: 'app-draft-overlay',
    standalone: true,
    imports: [Card],
    templateUrl: './draft-overlay.html',
    styleUrls: ['./draft-overlay.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftOverlay {
    readonly cards = input.required<CardModel[]>();
    readonly mySide = input.required<PlayerSide>();

    readonly draftSubmitted = output<[string, string]>();

    readonly selected = signal<Set<string>>(new Set());

    readonly isDark = computed(() => this.mySide() === 'dark');
    readonly canSubmit = computed(() => this.selected().size === 2);

    readonly title = computed(() =>
        this.isDark() ? 'Starting Draft — Pick 2' : 'Starting Draft'
    );

    readonly subtitle = computed(() =>
        this.isDark()
            ? 'Choose 2 cards. The other 2 go to Light.'
            : 'Waiting for Dark to pick 2 cards…'
    );

    isSelected(card: CardModel): boolean {
        return this.selected().has(card.id);
    }

    onCardClick(card: CardModel): void {
        if (!this.isDark()) return;
        this.selected.update(prev => {
            const next = new Set(prev);
            if (next.has(card.id)) {
                next.delete(card.id);
            } else if (next.size < 2) {
                next.add(card.id);
            }
            return next;
        });
    }

    onSubmit(): void {
        if (!this.canSubmit()) return;
        const ids = Array.from(this.selected()) as [string, string];
        this.draftSubmitted.emit(ids);
    }
}
