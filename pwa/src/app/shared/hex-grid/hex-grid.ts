import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-hex-grid',
    standalone: true,
    templateUrl: './hex-grid.html',
    styleUrls: ['./hex-grid.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HexGrid {
    readonly rows = Array.from({ length: 12 }, (_, i) => i);
    readonly cellsPerRow = Array.from({ length: 16 }, (_, i) => i);
}
