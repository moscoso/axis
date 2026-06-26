import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PlayerSide } from 'axis-models';

@Component({
    selector: 'app-rift-track',
    standalone: true,
    templateUrl: './rift-track.html',
    styleUrls: ['./rift-track.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RiftTrack {
    readonly value = input.required<number>();
    /**
     * The perspective side — that side's label sits at the BOTTOM of the track
     * (matching where the player's hand is shown on the board). When this is
     * 'dark', the track reads Light on top / Dark on bottom; when 'light', it's
     * Dark on top / Light on bottom.
     */
    readonly perspective = input<PlayerSide>('light');

    /** Where the Rift would land if the move being composed is confirmed; null hides the preview. */
    readonly preview = input<number | null>(null);

    readonly clamped = computed(() => Math.max(-6, Math.min(6, this.value())));

    /** Maps a clamped Rift value to a percentage from the TOP of the track. */
    private toPosition(clampedValue: number): number {
        // Default: +6 → 100% (Light at bottom), -6 → 0% (Dark at top).
        const lightPerspective = ((clampedValue + 6) / 12) * 100;
        return this.perspective() === 'dark' ? 100 - lightPerspective : lightPerspective;
    }

    /** Marker position as a percentage from the TOP of the track. */
    readonly position = computed(() => this.toPosition(this.clamped()));

    readonly previewClamped = computed<number | null>(() => {
        const p = this.preview();
        return p === null ? null : Math.max(-6, Math.min(6, p));
    });

    /** True only when there's a preview AND it differs from the live value. */
    readonly previewActive = computed(
        () => this.previewClamped() !== null && this.previewClamped() !== this.clamped()
    );

    readonly previewPosition = computed(() => {
        const c = this.previewClamped();
        return c === null ? 0 : this.toPosition(c);
    });

    /**
     * The connecting arrow between the live marker and the ghost: a thin bar
     * spanning the gap. `down` tells the template which end gets the head;
     * `good` is true when the Rift moves toward the perspective side's win
     * (Light wins at +8, Dark at −8), driving the green/red coloring.
     */
    readonly arrow = computed<{ top: number; height: number; down: boolean; good: boolean } | null>(() => {
        if (!this.previewActive()) return null;
        const from = this.position();
        const to = this.previewPosition();
        const delta = this.previewClamped()! - this.clamped();
        const towardMe = this.perspective() === 'light' ? delta : -delta;
        return { top: Math.min(from, to), height: Math.abs(to - from), down: to > from, good: towardMe > 0 };
    });

    readonly sideLeading = computed<'light' | 'dark' | 'neutral'>(() => {
        const v = this.value();
        if (v > 0) return 'light';
        if (v < 0) return 'dark';
        return 'neutral';
    });

    /** The side whose label shows at the TOP of the track (opponent of perspective). */
    readonly topSide = computed<PlayerSide>(() =>
        this.perspective() === 'dark' ? 'light' : 'dark'
    );
    /** The side whose label shows at the BOTTOM of the track (perspective side). */
    readonly bottomSide = computed<PlayerSide>(() => this.perspective());

    readonly topLimit = computed(() => (this.topSide() === 'light' ? '+6' : '−6'));
    readonly bottomLimit = computed(() => (this.bottomSide() === 'light' ? '+6' : '−6'));

    /**
     * One tick per integer value in the rift range (−6..+6 inclusive → 13 ticks).
     * Position is a % from the top; with 13 ticks over 100% the spacing is
     * 100/12 ≈ 8.3% between adjacent values. The tick at the center (index 6)
     * gets a `major` flag so it's rendered heavier.
     */
    readonly notches = computed<readonly { top: number; major: boolean }[]>(() =>
        Array.from({ length: 13 }, (_, i) => ({
            top: (i / 12) * 100,
            major: i === 6,
        }))
    );
}
