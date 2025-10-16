import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreinoPraComponent } from './treino-pra.component';

describe('TreinoPraComponent', () => {
  let component: TreinoPraComponent;
  let fixture: ComponentFixture<TreinoPraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreinoPraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreinoPraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
