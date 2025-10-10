import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchUpdate } from './branch-update';

describe('BranchUpdate', () => {
  let component: BranchUpdate;
  let fixture: ComponentFixture<BranchUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchUpdate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchUpdate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
