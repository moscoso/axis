import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
    Element,
    Game,
    PlayerSide,
    getFluxTotalForCruxLines,
    getTotalFluxScore,
} from 'axis-models';

const ELEMENT_SYMBOL: Record<Element, string> = {
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    comet: '☄️',
    planet: '🪐',
    'black-hole': '🌀',
};

interface CruxRow {
    element: Element;
    symbol: string;
    light: number;
    dark: number;
    diff: number;
    leader: PlayerSide | null;
    control: PlayerSide | 'unbound';
}

/**
 * At-a-glance view of flux pressure across the whole board:
 *
 * - **Total flux** for each side (every owned rune, summed). The headline
 *   answer to "who's ahead?" right now.
 * - **Per-Crux flux** along each Crux's row + column. This is the number
 *   that decides Crux control — comparing them tells the player exactly
 *   how big a swing they need to flip a Crux.
 *
 * Pure derivation from {@link Game}; updates on every reducer pass.
 */
@Component({
    selector: 'app-flux-scoreboard',
    standalone: true,
    templateUrl: './flux-scoreboard.html',
    styleUrls: ['./flux-scoreboard.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FluxScoreboard {
    readonly game = input.required<Game>();

    readonly lightTotal = computed(() => getTotalFluxScore(this.game(), 'light'));
    readonly darkTotal = computed(() => getTotalFluxScore(this.game(), 'dark'));
    readonly totalDiff = computed(() => this.lightTotal() - this.darkTotal());
    readonly totalLeader = computed<PlayerSide | null>(() => {
        const d = this.totalDiff();
        if (d > 0) return 'light';
        if (d < 0) return 'dark';
        return null;
    });

    readonly cruxes = computed<CruxRow[]>(() => {
        const g = this.game();
        return g.zones.map(zone => {
            const light = getFluxTotalForCruxLines(g, zone.cruxPosition, 'light');
            const dark = getFluxTotalForCruxLines(g, zone.cruxPosition, 'dark');
            const diff = light - dark;
            const leader: PlayerSide | null =
                diff > 0 ? 'light' : diff < 0 ? 'dark' : null;
            return {
                element: zone.element,
                symbol: ELEMENT_SYMBOL[zone.element],
                light,
                dark,
                diff,
                leader,
                control: zone.control,
            };
        });
    });

    /** Display "+3", "-2", "0". */
    formatDiff(diff: number): string {
        if (diff === 0) return '0';
        return diff > 0 ? `+${diff}` : `${diff}`;
    }
}
