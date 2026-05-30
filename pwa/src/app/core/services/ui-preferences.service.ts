import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'axis.ui-prefs';

/** Allowed scale range and step for the size knobs. 1 = default (100%). */
export const UI_SCALE_MIN = 0.8;
export const UI_SCALE_MAX = 1.6;
export const UI_SCALE_STEP = 0.1;

interface UiPrefs {
    /** Scale for the scoring/info widgets (rift rail + side rail). */
    scoringScale: number;
    /** Scale for the two player hands. */
    handScale: number;
    /** Whether the board's discount guideline edges are shown. */
    boardGuides: boolean;
}

const DEFAULTS: UiPrefs = { scoringScale: 1, handScale: 1, boardGuides: true };

function clampScale(value: number): number {
    if (!Number.isFinite(value)) return 1;
    const clamped = Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, value));
    // Snap to one decimal so the displayed percentage and stored value stay tidy.
    return Math.round(clamped * 10) / 10;
}

function readStored(): UiPrefs {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        const parsed = JSON.parse(raw) as Partial<UiPrefs>;
        return {
            scoringScale: clampScale(parsed.scoringScale ?? 1),
            handScale: clampScale(parsed.handScale ?? 1),
            boardGuides: parsed.boardGuides !== false,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

/**
 * Local, client-only UI preferences:
 *
 * - **scoringScale** / **handScale** — independent size knobs. Each is mirrored
 *   onto a root CSS variable (`--scoring-scale`, `--hand-scale`) that the game
 *   layout applies via `zoom` to the scoring widgets and the hands respectively,
 *   so the two groups resize separately.
 * - **boardGuides** — toggles the board's discount guideline edges.
 *
 * All three persist to localStorage and re-apply on load. Provided in root and
 * instantiated by the App component so saved values apply before first render.
 */
@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
    private readonly initial = readStored();

    private readonly _scoringScale = signal(this.initial.scoringScale);
    private readonly _handScale = signal(this.initial.handScale);
    private readonly _boardGuides = signal(this.initial.boardGuides);

    readonly scoringScale = this._scoringScale.asReadonly();
    readonly handScale = this._handScale.asReadonly();
    readonly boardGuides = this._boardGuides.asReadonly();

    readonly min = UI_SCALE_MIN;
    readonly max = UI_SCALE_MAX;
    readonly step = UI_SCALE_STEP;

    constructor() {
        effect(() => {
            const scoring = this._scoringScale();
            const hand = this._handScale();
            const guides = this._boardGuides();

            const root = document.documentElement.style;
            root.setProperty('--scoring-scale', String(scoring));
            root.setProperty('--hand-scale', String(hand));

            try {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ scoringScale: scoring, handScale: hand, boardGuides: guides })
                );
            } catch {
                // Storage unavailable (private mode / quota) — non-fatal.
            }
        });
    }

    setScoringScale(value: number): void {
        this._scoringScale.set(clampScale(value));
    }
    increaseScoring(): void {
        this.setScoringScale(this._scoringScale() + UI_SCALE_STEP);
    }
    decreaseScoring(): void {
        this.setScoringScale(this._scoringScale() - UI_SCALE_STEP);
    }

    setHandScale(value: number): void {
        this._handScale.set(clampScale(value));
    }
    increaseHand(): void {
        this.setHandScale(this._handScale() + UI_SCALE_STEP);
    }
    decreaseHand(): void {
        this.setHandScale(this._handScale() - UI_SCALE_STEP);
    }

    setBoardGuides(value: boolean): void {
        this._boardGuides.set(value);
    }
    toggleBoardGuides(): void {
        this._boardGuides.set(!this._boardGuides());
    }

    reset(): void {
        this._scoringScale.set(1);
        this._handScale.set(1);
        this._boardGuides.set(true);
    }
}
