import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TracertComponent } from './tracert.component';

describe('TracertComponent', () => {
  let component: TracertComponent;
  let fixture: ComponentFixture<TracertComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TracertComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TracertComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
