import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Same rules as the backend: at least 8 characters, a letter and a digit
export const passwordRules: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (value.length < 8) return { passwordShort: true };
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return { passwordWeak: true };
  return null;
};

// "Repeat password" must equal "password" (put on the form group)
export const passwordsMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirm')?.value ? null : { passwordsDiffer: true };
