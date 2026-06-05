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
    Card as CardModel,
    Glyph as GlyphSymbol,
    INIT_GAME_STATE,
    INIT_TABLE_STATE,
    PlayerSide,
    Position,
    Seat,
    autoSelectInscription,
    clientGameCommand,
    clientTableCommand,
    simulateGameCommand,
} from 'axis-models';
import { LogoutButton } from '../account/components/logout-button/logout-button';
import { UiPreferencesService } from '../core/services/ui-preferences.service';
import { AuthFacade } from '../core/state/auth/auth.facade';
import { DealerFacade } from '../core/state/dealer/dealer.facade';
import { ConnectionStatus } from '../core/websocket/connection-status/connection-status';
import { WebsocketService } from '../core/websocket/websocket.service';
import { HexGrid } from '../shared/hex-grid/hex-grid';
import { UserBadge } from '../shared/user-badge/user-badge';
import { ActionPanel } from './components/action-panel/action-panel';
import { Board } from './components/board/board';
import { CardDisplay } from './components/card-display/card-display';
import { DraftOverlay } from './components/draft-overlay/draft-overlay';
import { EventLog } from './components/event-log/event-log';
import { FluxScoreboard } from './components/flux-scoreboard/flux-scoreboard';
import { Hand } from './components/hand/hand';
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
        ActionPanel,
        Board,
        CardDisplay,
        ConnectionStatus,
        DraftOverlay,
        EventLog,
        FluxScoreboard,
        Hand,
        HexGrid,
        Lobby,
        LogoutButton,
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
    private readonly uiPrefs = inject(UiPreferencesService);

    /** Whether the board's discount guideline edges are shown (user setting). */
    readonly boardGuides = this.uiPrefs.boardGuides;

    /** Settings overlay visibility. */
    readonly settingsOpen = signal(false);
    openSettings(): void {
        this.settingsOpen.set(true);
    }
    closeSettings(): void {
        this.settingsOpen.set(false);
    }

    /** Event log drawer visibility. */
    readonly eventLogOpen = signal(false);
    openEventLog(): void {
        this.eventLogOpen.set(true);
    }
    closeEventLog(): void {
        this.eventLogOpen.set(false);
    }

    readonly game = toSignal(this.dealer.selectGame(), { requireSync: false, initialValue: INIT_GAME_STATE });
    readonly table = toSignal(this.dealer.selectState('table'), { requireSync: false, initialValue: INIT_TABLE_STATE });
    readonly userId = toSignal(this.auth.selectUserID(), { initialValue: 'unknown' });

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

    /**
     * Show the lobby until the game's own `phase` moves off 'setup'. The
     * table's status lags (it stays 'ready' after StartGame fires), so `phase`
     * is the reliable signal that the game has actually begun.
     */
    readonly inLobby = computed(() => this.phase() === 'setup');
    readonly currentTurn = computed(() => this.game().currentTurn);
    readonly rift = computed(() => this.game().rift);
    readonly zones = computed(() => this.game().zones);
    readonly display = computed(() => this.game().display);
    readonly deckSize = computed(() => this.game().deck.length);
    readonly discardSize = computed(() => this.game().discard.length);
    readonly lightPlayer = computed(() => this.game().players.light);
    readonly darkPlayer = computed(() => this.game().players.dark);
    readonly pendingDraws = computed(() => this.game().pendingDraws);
    readonly pendingStartOfTurnDraws = computed(() => this.game().pendingStartOfTurnDraws);
    /** Total cards the active player must draw before they may inscribe. */
    readonly requiredDraws = computed(() => this.pendingDraws() + this.pendingStartOfTurnDraws());

    /** Opponent of mySide — used for the top-hand perspective. */
    readonly opponentSide = computed<PlayerSide>(() =>
        this.mySide() === 'light' ? 'dark' : 'light'
    );

    /** The player shown on the BOTTOM of the board — always the user. */
    readonly bottomPlayer = computed(() => this.game().players[this.mySide()]);
    /** The player shown on the TOP of the board — always the opponent. */
    readonly topPlayer = computed(() => this.game().players[this.opponentSide()]);

    /**
     * Map each side to a table Seat via `game.playerIds`. Until StartGame runs
     * playerIds is null, so we fall back to the raw seats in their table order.
     */
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
        // Pre-game fallback: put seat[0] at the bottom of the perspective side.
        return side === 'light' ? seats[0] : seats[1];
    }

    /**
     * The side the user is playing as. Resolved from `game.playerIds` once the
     * game has started. Falls back to `currentTurn` when playerIds is still
     * null (dev without server) and pins to 'dark' during starting-draft.
     */
    readonly mySide = computed<PlayerSide>(() => {
        if (this.phase() === 'starting-draft') return 'dark';
        const ids = this.game().playerIds;
        const uid = this.userId();
        if (ids?.light === uid) return 'light';
        if (ids?.dark === uid) return 'dark';
        return this.currentTurn();
    });

    readonly isDrafting = computed(() => this.phase() === 'starting-draft');

    readonly winner = computed(() => this.game()?.winner ?? null);
    readonly winReason = computed(() => this.game()?.winReason ?? null);
    /**
     * True once the game has resolved one way or another — including a
     * last-rune tie, where `winner` is `null` but `winReason` is set.
     * Driven by `winReason` rather than `winner` so the victory modal
     * (and the game-over header buttons) fire on ties too.
     */
    readonly isGameOver = computed(
        () => this.phase() === 'game-over' && this.winReason() !== null
    );

    readonly victoryClosed = toSignal(this.dealer.selectState('victoryScreenClosed'), {
        initialValue: false,
    });

    readonly showVictory = computed(() => this.isGameOver() && !this.victoryClosed());

    readonly lightFlux = computed(() => this.totalFluxFor('light'));
    readonly darkFlux = computed(() => this.totalFluxFor('dark'));

    readonly myHand = computed(() => this.game()?.players[this.mySide()]?.hand ?? []);
    readonly isMyTurn = computed(() => this.currentTurn() === this.mySide());
    readonly inMainTurn = computed(() => this.phase() === 'main-turn');
    readonly mustDraw = computed(
        () => this.pendingDraws() > 0 || this.pendingStartOfTurnDraws() > 0
    );

    readonly canInscribe = computed(
        () => this.isMyTurn() && this.inMainTurn() && !this.mustDraw()
    );
    /**
     * Drawing is always available during your main turn — either as the
     * standalone main action ("Draw a Card" per the rulebook, pendingDraws
     * === 0) or as a resolution of an activated ◇ (pendingDraws > 0). The
     * `mustDraw` state only restricts Inscribe, not Draw itself.
     */
    readonly canDraw = computed(() => this.isMyTurn() && this.inMainTurn());

    readonly selectedCell = signal<Position | null>(null);
    readonly paidCardIds = signal<Set<string>>(new Set());
    readonly chosenActivations = signal<Map<GlyphSymbol, number>>(new Map());

    /**
     * What-if outcome of the move currently being composed, run through the
     * pure simulator so the UI can preview results (rift shift, draws, crux
     * flips) without re-deriving any rules in Angular. Null when there's no
     * target or the current payment/activations aren't yet a legal inscribe —
     * previews simply hide until the move is confirmable.
     */
    readonly previewState = computed(() => {
        const target = this.selectedCell();
        if (!target || !this.canInscribe()) return null;
        // A preview must NEVER break core play: the simulator runs follow-up
        // commands (EndTurn → refill/reshuffle) that could throw on some states,
        // and this computed is read inline in the game view — an uncaught throw
        // here would abort change detection and hide the action panel itself.
        try {
            const command = clientGameCommand('InscribeRune', {
                player: this.mySide(),
                target,
                paidCardIds: Array.from(this.paidCardIds()),
                chosenActivations: this.expandActivations(this.chosenActivations()),
            });
            const result = simulateGameCommand(this.game(), command);
            return result.ok ? result.state : null;
        } catch {
            return null;
        }
    });

    /** Rift after the composed move, or null when there's no live preview. */
    readonly previewRift = computed(() => this.previewState()?.rift ?? null);

    /** The rune as it would land on the selected cell (carrying any charged flux). */
    readonly previewRune = computed(() => {
        const state = this.previewState();
        const target = this.selectedCell();
        if (!state || !target) return null;
        return state.board[target.row]?.[target.col]?.rune ?? null;
    });

    /** Cards the composed move would queue to draw (◇ activations); 0 when no preview. */
    readonly previewDraws = computed(() => this.previewState()?.pendingDraws ?? 0);

    /** Stable empty set passed to the opposite-side hand to avoid identity churn. */
    readonly emptyIds: ReadonlySet<string> = new Set();

    onCellClick(pos: Position): void {
        if (!this.canInscribe()) return;
        const cell = this.game().board[pos.row]?.[pos.col];
        if (cell?.rune !== null) return;
        this.selectedCell.set(pos);
        // Pre-fill a sensible default move (cheapest payment + flux-first activations)
        // so the player can confirm in one click — still fully editable below.
        const auto = autoSelectInscription(this.game(), this.mySide(), pos);
        this.paidCardIds.set(new Set(auto?.paidCardIds ?? []));
        this.chosenActivations.set(this.collapseActivations(auto?.activations ?? []));
    }

    /** Flattened activation list → the per-glyph count map the panel/preview use. */
    private collapseActivations(activations: GlyphSymbol[]): Map<GlyphSymbol, number> {
        const map = new Map<GlyphSymbol, number>();
        for (const g of activations) map.set(g, (map.get(g) ?? 0) + 1);
        return map;
    }

    onHandCardPicked(card: CardModel): void {
        if (!this.canInscribe() || this.selectedCell() === null) return;
        this.paidCardIds.update(prev => {
            const next = new Set(prev);
            if (next.has(card.id)) next.delete(card.id);
            else next.add(card.id);
            return next;
        });
        // Activations used to reset on every payment change, which punished the
        // player mid-composition. Keep them and let the ActionPanel's own
        // validation gate `canConfirm` instead — the player just sees that the
        // totals don't match and can adjust.
    }

    onActivationChanged(change: { glyph: GlyphSymbol; delta: number }): void {
        this.chosenActivations.update(prev => {
            const next = new Map(prev);
            const current = next.get(change.glyph) ?? 0;
            const updated = Math.max(0, current + change.delta);
            if (updated === 0) next.delete(change.glyph);
            else next.set(change.glyph, updated);
            return next;
        });
    }

    onConfirmInscribe(): void {
        const target = this.selectedCell();
        if (!target) return;
        const activations = this.expandActivations(this.chosenActivations());
        const command = clientGameCommand('InscribeRune', {
            player: this.mySide(),
            target,
            paidCardIds: Array.from(this.paidCardIds()),
            chosenActivations: activations,
        });
        this.dealer.signalAsPlayer(command);
        this.clearSelection();
    }

    onCancelInscribe(): void {
        this.clearSelection();
    }

    onDisplayCardPicked(card: CardModel): void {
        if (!this.canDraw()) return;
        const params = { player: this.mySide(), from: 'display', cardId: card.id } as const;
        this.dealer.signalAsPlayer(clientGameCommand('DrawCard', params));
    }

    onDrawFromDeck(): void {
        if (!this.canDraw()) return;
        const params = { player: this.mySide(), from: 'deck' } as const;
        this.dealer.signalAsPlayer(clientGameCommand('DrawCard', params));
    }

    onDraftSubmitted(cardIds: [string, string]): void {
        const command = clientGameCommand('DraftCards', { player: 'dark', cardIds });
        this.dealer.signalAsPlayer(command);
    }

    onDismissVictory(): void {
        this.dealer.closeVictoryScreen();
    }

    /**
     * Reset the current game and immediately start a fresh one with the same
     * seats / side preferences. This is a lifecycle signal, not a game
     * command — the server's dealer dereferences the current game aggregate,
     * builds a fresh one, then fires StartGame against the live table.
     */
    onPlayAgain(): void {
        this.socket.emitRestart(this.socket.getCurrentRoomID());
        this.dealer.closeVictoryScreen();
    }

    /**
     * Empty the table — kicks every seated player (including bots) back to
     * the lobby. The previous game state is reset by the existing Table
     * Cleaned trigger so the fresh group can play immediately when the
     * seats fill up again.
     */
    onNewGame(): void {
        this.dealer.signalAsHost(clientTableCommand('VacateTable', {}));
        this.dealer.closeVictoryScreen();
    }

    private totalFluxFor(side: PlayerSide): number {
        const board = this.game()?.board;
        if (!board) return 0;
        let total = 0;
        for (const row of board) {
            for (const cell of row) {
                if (cell.rune?.owner === side) total += cell.rune.flux;
            }
        }
        return total;
    }

    private clearSelection(): void {
        this.selectedCell.set(null);
        this.paidCardIds.set(new Set());
        this.chosenActivations.set(new Map());
    }

    private expandActivations(map: ReadonlyMap<GlyphSymbol, number>): GlyphSymbol[] {
        const out: GlyphSymbol[] = [];
        for (const [glyph, count] of map) {
            for (let i = 0; i < count; i++) out.push(glyph);
        }
        return out;
    }
}
