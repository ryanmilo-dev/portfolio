import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'main-page',
  standalone: true,
  templateUrl: './main-page.html',
  styleUrls: ['./main-page.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('1000ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class MainPageComponent {}
