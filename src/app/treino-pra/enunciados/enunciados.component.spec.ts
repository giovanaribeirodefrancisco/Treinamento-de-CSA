import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnunciadosComponent } from './enunciados.component';

describe('EnunciadosComponent', () => {
  let component: EnunciadosComponent;
  let fixture: ComponentFixture<EnunciadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnunciadosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnunciadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
