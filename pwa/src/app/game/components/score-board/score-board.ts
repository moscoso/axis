import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Color, Game, PlayerSide, getCrossCells } from 'axis-models';
import { COLOR_SYMBOL } from '../board-cell/board-cell';

interface CruxRow {
    color: Color;
    symbol: string;
    light: number;
    dark: number;
    diff: number;
    leader: PlayerSide | null;
}

/**
 * At-a-glance score view:
 *
 * - **Total score** for each side — the End-Score win track.
 * - **Per-Crux presence**: how many stones each side holds on that Crux's cross
 *   (its row + column). A read on who dominates each line, and thus who profits
 *   most when that Crux fires.
 *
 * Pure derivation from {@link Game}; updates on every reducer pass.
 */
@Component({
    selector: 'app-score-board',
    standalone: true,
    templateUrl: './score-board.html',
    styleUrls: ['./score-board.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreBoard {
    readonly game = input.required<Game>();

    readonly lightTotal = computed(() => this.game().score.light);
    readonly darkTotal = computed(() => this.game().score.dark);
    readonly totalDiff = computed(() => this.lightTotal() - this.darkTotal());
    readonly totalLeader = computed<PlayerSide | null>(() => {
        const d = this.totalDiff();
        if (d > 0) return 'light';
        if (d < 0) return 'dark';
        return null;
    });

    readonly cruxes = computed<CruxRow[]>(() => {
        const g = this.game();
        return g.cruxes.map(crux => {
            let light = 0;
            let dark = 0;
            for (const p of getCrossCells(g, crux.color)) {
                const owner = g.board[p.row]?.[p.col]?.stone?.owner;
                if (owner === 'light') light++;
                else if (owner === 'dark') dark++;
            }
            const diff = light - dark;
            const leader: PlayerSide | null = diff > 0 ? 'light' : diff < 0 ? 'dark' : null;
            return { color: crux.color, symbol: COLOR_SYMBOL[crux.color], light, dark, diff, leader };
        });
    });

    /** Display "+3", "-2", "0". */
    formatDiff(diff: number): string {
        if (diff === 0) return '0';
        return diff > 0 ? `+${diff}` : `${diff}`;
    }
}
