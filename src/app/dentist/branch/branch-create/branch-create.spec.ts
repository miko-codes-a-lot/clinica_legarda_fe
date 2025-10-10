import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchCreate } from './branch-create';

describe('BranchCreate', () => {
  let component: BranchCreate;
  let fixture: ComponentFixture<BranchCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
