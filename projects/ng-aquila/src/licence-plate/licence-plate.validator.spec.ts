import { ChangeDetectionStrategy, Component, Type, ViewChild } from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';
import {
  AbstractControl,
  FormControl,
  FormsModule,
  NgModel,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  NxLicencePlateType,
  NxLicencePlateValidatorDirective,
  nxLicensePlateValidator,
} from './licence-plate.validator';

const EXAMPLE_LICENCE_PLATE_NUMBERS = {
  de_standard: {
    valid: ['', 'M-AB 1234', 'M-AB 1234E', 'M-AB 1234H', 'ABC-XY 123'],
    invalid: ['1-XY 1234', 'M-ABC 1234', 'M-1234 XY', 'S-ÄÜ 43'],
  },
  de_special: {
    valid: ['', 'M-07234', 'S-06438', 'KA-04401', 'B-123X'],
    invalid: ['AÜÖ123-XY 1234', 'S 123 123$'],
  },
  other: {
    valid: ['', 'abcABC123%&/- '],
    invalid: [],
  },
  euro: {
    valid: ['', 'abcABC123%&/- '],
    invalid: [],
  },
};

describe('NxLicencePlateValidator', () => {
  for (const [type, numbers] of Object.entries(EXAMPLE_LICENCE_PLATE_NUMBERS)) {
    describe(`type ${type}`, () => {
      for (const validNumber of numbers.valid) {
        it(`allows valid licence plate number "${validNumber}"`, () => {
          expect(
            nxLicensePlateValidator(type as NxLicencePlateType)({
              value: validNumber,
            } as AbstractControl),
          ).toBeNull();
        });
      }

      for (const invalidNumber of numbers.invalid) {
        it(`does not allow invalid licence plate number "${invalidNumber}"`, () => {
          expect(
            nxLicensePlateValidator(type as NxLicencePlateType)({
              value: invalidNumber,
            } as AbstractControl),
          ).toEqual({ nxLicensePlateError: true });
        });
      }
    });
  }
});

describe('NxLicencePlateValidatorDirective', () => {
  let fixture: ComponentFixture<ReactiveLicencePlateComponent>;
  let testInstance: ReactiveLicencePlateComponent;
  let control: FormControl;

  function createTestComponent(component: Type<ReactiveLicencePlateComponent>) {
    fixture = TestBed.createComponent(component);
    fixture.detectChanges();
    testInstance = fixture.componentInstance;
    control = testInstance.control;
  }

  function setValue(value: string | null) {
    control.setValue(value);
    fixture.detectChanges();
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        ReactiveLicencePlateComponent,
        NgModelLicencePlateComponent,
      ],
    }).compileComponents();
  }));

  describe('forms registration', () => {
    beforeEach(() => {
      createTestComponent(ReactiveLicencePlateComponent);
      testInstance.type = 'de_standard';
      fixture.detectChanges();
    });

    it('adds the validation error to the bound control', () => {
      setValue('M-ABC 1234');

      expect(control.errors).toEqual({ nxLicensePlateError: true });
      expect(control.valid).toBe(false);
      expect(control.value).toBe('M-ABC 1234');
    });

    it('clears the validation error for a valid value', () => {
      setValue('M-ABC 1234');
      setValue('M-AB 1234');

      expect(control.errors).toBeNull();
      expect(control.valid).toBe(true);
      expect(control.value).toBe('M-AB 1234');
    });

    it('validates through ngModel as well', fakeAsync(() => {
      const ngModelFixture = TestBed.createComponent(NgModelLicencePlateComponent);
      ngModelFixture.detectChanges();
      flushMicrotasks();

      const ngModel = ngModelFixture.componentInstance.model;
      ngModel.control.setValue('M-ABC 1234');
      ngModelFixture.detectChanges();
      expect(ngModel.errors).toEqual({ nxLicensePlateError: true });

      ngModel.control.setValue('M-AB 1234');
      ngModelFixture.detectChanges();
      expect(ngModel.errors).toBeNull();
    }));
  });

  describe('type other', () => {
    beforeEach(() => {
      createTestComponent(ReactiveLicencePlateComponent);
    });

    it('accepts any non empty value', () => {
      setValue('abcABC123%&/- ');

      expect(control.errors).toBeNull();
      expect(control.valid).toBe(true);
    });

    it('has other as the default of the untouched type input', () => {
      const directive = TestBed.runInInjectionContext(() => new NxLicencePlateValidatorDirective());

      expect(directive.type()).toBe('other');
      expect(directive.validate(new FormControl('abcABC123%&/- '))).toBeNull();
    });
  });

  describe('type de_season', () => {
    beforeEach(() => {
      createTestComponent(ReactiveLicencePlateComponent);
      testInstance.type = 'de_season';
      fixture.detectChanges();
    });

    for (const validNumber of ['M-AB 1234', 'M-AB 1234E', 'M-AB 1234H']) {
      it(`accepts the standard format value "${validNumber}"`, () => {
        setValue(validNumber);

        expect(control.errors).toBeNull();
        expect(control.valid).toBe(true);
      });
    }

    // de_season shares the de_standard pattern, so a trailing season period is
    // just another string the pattern does not match.
    for (const invalidNumber of ['M-1234 XY', 'M-AB 1234 03/10']) {
      it(`rejects "${invalidNumber}"`, () => {
        setValue(invalidNumber);

        expect(control.errors).toEqual({ nxLicensePlateError: true });
      });
    }

    for (const emptyValue of ['', null]) {
      it(`accepts the empty value ${JSON.stringify(emptyValue)}`, () => {
        setValue(emptyValue);

        expect(control.errors).toBeNull();
        expect(control.valid).toBe(true);
      });
    }
  });

  describe('boundaries of the de_standard pattern', () => {
    beforeEach(() => {
      createTestComponent(ReactiveLicencePlateComponent);
      testInstance.type = 'de_standard';
      fixture.detectChanges();
    });

    for (const validNumber of ['M-A 1', 'ABC-XY 1234', 'MÜ-AB 1234']) {
      it(`accepts "${validNumber}"`, () => {
        setValue(validNumber);

        expect(control.errors).toBeNull();
      });
    }

    for (const invalidNumber of ['ABCD-XY 1234', 'M-AB 12345', 'M-ABC 1234', 'M-AB 1234X']) {
      it(`rejects "${invalidNumber}"`, () => {
        setValue(invalidNumber);

        expect(control.errors).toEqual({ nxLicensePlateError: true });
      });
    }
  });

  describe('changing the type input', () => {
    beforeEach(() => {
      createTestComponent(ReactiveLicencePlateComponent);
    });

    it('applies the new type when the control is revalidated', () => {
      setValue('not a plate');
      expect(control.errors).toBeNull();

      testInstance.type = 'de_standard';
      fixture.detectChanges();
      control.updateValueAndValidity();

      expect(control.errors).toEqual({ nxLicensePlateError: true });
      expect(control.value).toBe('not a plate');
    });

    it('applies the new type on the next value change', () => {
      testInstance.type = 'de_standard';
      fixture.detectChanges();
      setValue('not a plate');

      expect(control.errors).toEqual({ nxLicensePlateError: true });
    });
  });
});

@Component({
  selector: 'test-reactive-licence-plate',
  template: `<input [nxLicensePlate]="type" [formControl]="control" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, NxLicencePlateValidatorDirective],
})
class ReactiveLicencePlateComponent {
  @ViewChild(NxLicencePlateValidatorDirective)
  instance!: NxLicencePlateValidatorDirective;

  type: NxLicencePlateType = 'other';
  control = new FormControl('');
}

@Component({
  selector: 'test-ng-model-licence-plate',
  template: `<input [nxLicensePlate]="'de_standard'" [(ngModel)]="value" name="plate" />`,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [FormsModule, NxLicencePlateValidatorDirective],
})
class NgModelLicencePlateComponent {
  @ViewChild(NgModel) model!: NgModel;

  value = '';
}
