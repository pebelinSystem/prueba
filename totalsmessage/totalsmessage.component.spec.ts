import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalsmessageComponent } from './totalsmessage.component';

describe('TotalsmessageComponent', () => {
  let component: TotalsmessageComponent;
  let fixture: ComponentFixture<TotalsmessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalsmessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalsmessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
