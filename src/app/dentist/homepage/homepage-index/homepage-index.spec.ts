import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomepageIndex } from './homepage-index';

describe('HomepageIndex', () => {
  let component: HomepageIndex;
  let fixture: ComponentFixture<HomepageIndex>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageIndex]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomepageIndex);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
