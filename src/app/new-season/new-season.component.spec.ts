import { TestBed } from '@angular/core/testing';
import { NewSeasonComponent } from './new-season.component';

describe('NewSeasonComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSeasonComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(NewSeasonComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
