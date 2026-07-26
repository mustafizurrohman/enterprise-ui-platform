import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnterpriseUi } from './enterprise-ui';

describe('EnterpriseUi', () => {
  let component: EnterpriseUi;
  let fixture: ComponentFixture<EnterpriseUi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnterpriseUi],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterpriseUi);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
