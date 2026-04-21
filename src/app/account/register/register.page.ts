import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, HostBinding, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RegisterForm } from '../components/register-form/register-form';

const BREAKPOINT_LABELS = new Map<string, string>([
    [Breakpoints.XSmall, 'XSmall'],
    [Breakpoints.Small, 'Small'],
    [Breakpoints.Medium, 'Medium'],
    [Breakpoints.Large, 'Large'],
    [Breakpoints.XLarge, 'XLarge'],
]);

@Component({
    selector: 'app-register-page',
    standalone: true,
    imports: [RegisterForm, RouterLink, MatButtonModule],
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
    private readonly breakpointObserver = inject(BreakpointObserver);

    @HostBinding('class') currentScreenSize = '';

    constructor() {
        this.breakpointObserver
            .observe([...BREAKPOINT_LABELS.keys()])
            .pipe(takeUntilDestroyed())
            .subscribe(result => {
                for (const query of Object.keys(result.breakpoints)) {
                    if (result.breakpoints[query]) {
                        this.currentScreenSize = BREAKPOINT_LABELS.get(query) ?? 'Unknown';
                    }
                }
            });
    }
}
