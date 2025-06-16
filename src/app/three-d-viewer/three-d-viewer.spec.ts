import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreeDViewerComponent } from './three-d-viewer';

describe('ThreeDViewerComponent', () => {
  let component: ThreeDViewerComponent;
  let fixture: ComponentFixture<ThreeDViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreeDViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreeDViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
