import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-create-profile-page',
    standalone: true,
    imports: [RouterLink, MatButtonModule],
    template: `
        <main>
            <h1>Create your profile</h1>
            <p>Profile creation — coming soon.</p>
            <button mat-raised-button routerLink="/game">Continue</button>
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
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateProfilePage {}
