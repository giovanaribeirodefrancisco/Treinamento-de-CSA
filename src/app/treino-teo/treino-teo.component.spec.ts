import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoTeoComponent } from './treino-teo.component';

describe('TreinoTeoComponent', () => {
  let component: TreinoTeoComponent;
  let fixture: ComponentFixture<TreinoTeoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoTeoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreinoTeoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
