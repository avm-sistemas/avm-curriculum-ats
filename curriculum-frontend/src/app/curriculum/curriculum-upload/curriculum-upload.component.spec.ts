import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CurriculumUploadComponent } from './curriculum-upload.component';

describe('CurriculumUploadComponent', () => {
  let component: CurriculumUploadComponent;
  let fixture: ComponentFixture<CurriculumUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurriculumUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CurriculumUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
