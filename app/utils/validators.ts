const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isRequired = (value: string): boolean => value.trim().length > 0;

export const isEmail = (value: string): boolean => EMAIL_REGEX.test(value);

export const minLength = (min: number) => (value: string): boolean =>
  value.length >= min;

export const matchesField = (other: string) => (value: string): boolean =>
  value === other;

export type ValidationRule = {
  check: (value: string) => boolean;
  message: string;
};

export function createValidator(rules: ValidationRule[]) {
  return (value: string): string | null => {
    for (const rule of rules) {
      if (!rule.check(value)) return rule.message;
    }
    return null;
  };
}

export function validateForm(
  ...results: Array<string | null>
): string | null {
  for (const error of results) {
    if (error) return error;
  }
  return null;
}
