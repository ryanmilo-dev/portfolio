import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CircleMenuComponent } from './circle-menu';

describe('CircleMenuComponent', () => {
  let component: CircleMenuComponent;
  let fixture: ComponentFixture<CircleMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CircleMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CircleMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
