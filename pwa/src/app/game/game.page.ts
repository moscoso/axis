import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import {
    Color,
    INIT_GAME_STATE,
    INIT_TABLE_STATE,
    PlayerSide,
    Position,
    Seat,
    clientGameCommand,
    clientTableCommand,
} from 'axis-models';
import { AuthFacade } from '../core/state/auth/auth.facade';
import { DealerFacade } from '../core/state/dealer/dealer.facade';
import { ConnectionStatus } from '../core/websocket/connection-status/connection-status';
import { WebsocketService } from '../core/websocket/websocket.service';
import { UserBadge } from '../shared/user-badge/user-badge';
import { Board } from './components/board/board';
import { DicePool } from './components/dice-pool/dice-pool';
import { EventLog } from './components/event-log/event-log';
import { Lobby } from './components/lobby/lobby';
import { PlayerPanel } from './components/player-panel/player-panel';
import { RiftTrack } from './components/rift-track/rift-track';
import { Settings } from './components/settings/settings';
import { TurnIndicator } from './components/turn-indicator/turn-indicator';
import { VictoryModal } from './components/victory-modal/victory-modal';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [
        Board,
        ConnectionStatus,
        DicePool,
        EventLog,
        Lobby,
        MatButtonModule,
        PlayerPanel,
        RiftTrack,
        Settings,
        TurnIndicator,
        UserBadge,
        VictoryModal,
    ],
    templateUrl: './game.page.html',
    styleUrls: ['./game.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {
    private readonly dealer = inject(DealerFacade);
    private readonly auth = inject(AuthFacade);
    private readonly socket = inject(WebsocketService);

    /** Settings overlay visibility. */
    readonly settingsOpen = signal(false);
    openSettings(): void { this.settingsOpen.set(true); }
    closeSettings(): void { this.settingsOpen.set(false); }

    /** Event log drawer visibility. */
    readonly eventLogOpen = signal(false);
    openEventLog(): void { this.eventLogOpen.set(true); }
    closeEventLog(): void { this.eventLogOpen.set(false); }

    readonly game = toSignal(this.dealer.selectGame(), { requireSync: false, initialValue: INIT_GAME_STATE });
    readonly table = toSignal(this.dealer.selectState('table'), { requireSync: false, initialValue: INIT_TABLE_STATE });
    readonly userId = toSignal(this.auth.selectUserID(), { initialValue: 'unknown' });
    readonly armedColor = toSignal(this.dealer.selectState('selectedDieColor'), { initialValue: undefined });

    /** Joins the shared room as soon as the authed user's id is known. */
    private readonly joinedOnce = signal(false);
    private readonly autoJoin = effect(() => {
        const uid = this.userId();
        if (uid === 'unknown' || this.joinedOnce()) return;
        this.socket.join(uid);
        this.joinedOnce.set(true);
    });

    readonly tableStatus = computed(() => this.table().status);
    readonly phase = computed(() => this.game().phase);

    /** Show the lobby until the game's own `phase` moves off 'setup'. */
    readonly inLobby = computed(() => this.phase() === 'setup');
    readonly currentTurn = computed(() => this.game().currentTurn);
    readonly rift = computed(() => this.game().rift);
    readonly dice = computed(() => this.game().dice);
    readonly score = computed(() => this.game().score);
    readonly lightScore = computed(() => this.score().light);
    readonly darkScore = computed(() => this.score().dark);

    readonly opponentSide = computed<PlayerSide>(() => (this.mySide() === 'light' ? 'dark' : 'light'));

    readonly lightSeat = computed<Seat | null>(() => this.seatForSide('light'));
    readonly darkSeat = computed<Seat | null>(() => this.seatForSide('dark'));
    readonly bottomSeat = computed<Seat | null>(() => this.seatForSide(this.mySide()));
    readonly topSeat = computed<Seat | null>(() => this.seatForSide(this.opponentSide()));

    private seatForSide(side: PlayerSide): Seat | null {
        const ids = this.game().playerIds;
        const seats = this.table().seats;
        if (ids) {
            const userId = ids[side];
            return seats.find(s => s?.user.id === userId) ?? null;
        }
        return side === 'light' ? seats[0] : seats[1];
    }

    /**
     * The side the user is playing. Resolved from `game.playerIds` once the game
     * has started; falls back to `currentTurn` when playerIds is still null
     * (dev without server).
     */
    readonly mySide = computed<PlayerSide>(() => {
        const ids = this.game().playerIds;
        const uid = this.userId();
        if (ids?.light === uid) return 'light';
        if (ids?.dark === uid) return 'dark';
        return this.currentTurn();
    });

    readonly winner = computed(() => this.game()?.winner ?? null);
    readonly winReason = computed(() => this.game()?.winReason ?? null);
    readonly isGameOver = computed(() => this.phase() === 'game-over' && this.winReason() !== null);

    readonly victoryClosed = toSignal(this.dealer.selectState('victoryScreenClosed'), { initialValue: false });
    readonly showVictory = computed(() => this.isGameOver() && !this.victoryClosed());

    readonly isMyTurn = computed(() => this.currentTurn() === this.mySide());
    readonly inMainTurn = computed(() => this.phase() === 'main-turn');
    readonly canInscribe = computed(() => this.isMyTurn() && this.inMainTurn());

    // ─── Interaction ────────────────────────────────────────────────────────────

    /** Arm (or toggle off) a die by color. */
    onDieSelected(color: Color): void {
        if (!this.canInscribe()) return;
        if (this.armedColor() === color) {
            this.dealer.unselectDie();
        } else {
            this.dealer.selectDie(color);
        }
    }

    /** Inscribe the armed die on a clicked eligible cell. */
    onCellClick(pos: Position): void {
        const color = this.armedColor();
        if (!color || !this.canInscribe()) return;
        const cell = this.game().board[pos.row]?.[pos.col];
        if (!cell || cell.hasCrux || cell.stone !== null) return;
        if (cell.rowColor !== color && cell.colColor !== color) return;
        this.dealer.signalAsPlayer(
            clientGameCommand('InscribeGlyph', { player: this.mySide(), dieColor: color, target: pos })
        );
        // playerSignaled disarms the die in the reducer.
    }

    onDismissVictory(): void {
        this.dealer.closeVictoryScreen();
    }

    onPlayAgain(): void {
        this.socket.emitRestart(this.socket.getCurrentRoomID());
        this.dealer.closeVictoryScreen();
    }

    onNewGame(): void {
        this.dealer.signalAsHost(clientTableCommand('VacateTable', {}));
        this.dealer.closeVictoryScreen();
    }
}
