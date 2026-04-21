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

    readonly clamped = computed(() => Math.max(-8, Math.min(8, this.value())));

    /** Marker position as a percentage from the TOP of the track. */
    readonly position = computed(() => {
        // Default: +8 → 100% (Light at bottom), -8 → 0% (Dark at top).
        const lightPerspective = ((this.clamped() + 8) / 16) * 100;
        return this.perspective() === 'dark' ? 100 - lightPerspective : lightPerspective;
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

    readonly topLimit = computed(() => (this.topSide() === 'light' ? '+8' : '−8'));
    readonly bottomLimit = computed(() => (this.bottomSide() === 'light' ? '+8' : '−8'));

    /**
     * One tick per integer value in the rift range (−8..+8 inclusive → 17 ticks).
     * Position is a % from the top; with 17 ticks over 100% the spacing is
     * 100/16 = 6.25% between adjacent values. The tick at the center (index 8)
     * gets a `major` flag so it's rendered heavier.
     */
    readonly notches = computed<readonly { top: number; major: boolean }[]>(() =>
        Array.from({ length: 17 }, (_, i) => ({
            top: (i / 16) * 100,
            major: i === 8,
        }))
    );
}
