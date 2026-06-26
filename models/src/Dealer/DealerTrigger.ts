import { clientGameCommand } from '../Game';
import { clientTableCommand } from '../Table';
import { GameEventType } from '../Game/GameEvent/GameEvent';
import { TableEventType } from '../Table/TableEvent/TableEvent';
import { Dealer } from './Dealer';

type ConditionFn = (dealer: Dealer) => boolean;
type DealerFn    = (dealer: Dealer) => void;

/** Represents an automatic command trigger for the {@link Dealer}. */
export type DealerTrigger = {
	/** Table or game event types that activate this trigger, or `'*'` for all events. */
	on:            (GameEventType | TableEventType)[] | '*';
	/** Table command to execute when triggered — table state is auto-injected. */
	tableCommand?: string;
	/** Optional condition — trigger only fires if this returns true. */
	if?:           ConditionFn;
	/** Optional side-effect to run on the dealer before any command. Use for cross-domain triggers or commands requiring extra params. */
	effect?:       DealerFn;
};

export const DEALER_TRIGGERS: DealerTrigger[] = [
	/**
	 * Start (or restart) the game whenever a player joins or leaves
	 * and the table is ready with no game already in progress.
	 */
	{
		on:          ['Player Joined', 'Player Left'],
		if:          dealer => shouldStartGame(dealer),
		effect:      dealer => {
			const { seats } = dealer.tableState;
			if (!seats[0] || !seats[1]) return;
			dealer.executeGameCommand(
				clientGameCommand('StartGame', { table: dealer.tableState })
			);
		},
	},

	/**
	 * Reset the game when the table is cleaned so the next session starts fresh.
	 * resetGame broadcasts the reset, so "New Game" actually returns clients to
	 * the lobby instead of leaving them stuck on the game-over view.
	 */
	{
		on:    ['Table Cleaned'],
		effect: dealer => dealer.resetGame(),
	},

	/**
	 * Record the result when a game ends.
	 * lightId / darkId are read from the game's resolved playerIds.
	 */
	{
		on:    ['Game Ended'],
		if:    dealer => dealer.gameState.playerIds !== null,
		effect: dealer => {
			const { playerIds } = dealer.gameState;
			if (!playerIds) return;
			dealer.executeTableCommand(
				clientTableCommand('RecordGame', {
					game:    dealer.gameState,
					lightId: playerIds.light,
					darkId:  playerIds.dark,
				})
			);
		},
	},
];

function shouldStartGame(dealer: Dealer): boolean {
	return dealer.tableState.status  === 'ready'
		&& dealer.gameState.phase === 'setup';
}
