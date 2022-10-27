import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UnrecognizedMessage } from './UnrecognizedMessage.component';

describe('UnrecognizedMessage', () => {
  let component: UnrecognizedMessage;
  let fixture: ComponentFixture<UnrecognizedMessage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UnrecognizedMessage ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UnrecognizedMessage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
