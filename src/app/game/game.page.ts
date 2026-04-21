import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LogoutButton } from '../account/components/logout-button/logout-button';
import { ConnectionStatus } from '../core/websocket/connection-status/connection-status';

@Component({
    selector: 'app-game-page',
    standalone: true,
    imports: [LogoutButton, ConnectionStatus],
    template: `
        <app-connection-status></app-connection-status>
        <main>
            <h1>AXIS</h1>
            <p>Game screen — coming soon.</p>
            <app-logout-button></app-logout-button>
        </main>
    `,
    styles: [`
        :host {
            display: block;
            width: 100vw;
            height: 100vh;
            background: #0b0f1a;
            color: #fff;
        }
        main {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 1rem;
        }
        h1 {
            letter-spacing: 0.3em;
            margin: 0;
        }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {}
