import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
    selector: '[clickOutside]',
    standalone: true,
})
export class ClickOutsideDirective {
    private readonly elementRef = inject(ElementRef<HTMLElement>);

    readonly clickOutside = output<MouseEvent>();

    @HostListener('document:click', ['$event', '$event.target'])
    onClick(event: MouseEvent, targetElement: EventTarget | null): void {
        if (!targetElement) return;
        if (!this.elementRef.nativeElement.contains(targetElement as Node)) {
            this.clickOutside.emit(event);
        }
    }

    @HostListener('document:tap', ['$event', '$event.target'])
    onTap(event: Event, targetElement: EventTarget | null): void {
        if (!targetElement) return;
        if (!this.elementRef.nativeElement.contains(targetElement as Node)) {
            this.clickOutside.emit(event as MouseEvent);
        }
    }
}
