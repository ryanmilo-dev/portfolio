import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root', // Makes the service available app-wide; you can scope it if needed
})
export class CircleMenuService {
  action$ = new Subject<{ type: string, value: any }>();
}
