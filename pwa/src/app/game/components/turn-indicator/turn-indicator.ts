import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { GamePhase, PlayerSide } from 'axis-models';

const PHASE_LABEL: Record<GamePhase, string> = {
    'setup': 'Setting up',
    'starting-draft': 'Starting Draft',
    'main-turn': 'Main Phase',
    'game-over': 'Game Over',
};

@Component({
    selector: 'app-turn-indicator',
    standalone: true,
    templateUrl: './turn-indicator.html',
    styleUrls: ['./turn-indicator.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-turn]': 'currentTurn()',
        '[attr.data-phase]': 'phase()',
    },
})
export class TurnIndicator {
    readonly currentTurn = input.required<PlayerSide>();
    readonly phase = input.required<GamePhase>();

    readonly phaseLabel = computed(() => PHASE_LABEL[this.phase()]);
    readonly showTurn = computed(() => this.phase() === 'main-turn');
}
