export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 25,
  pattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/,
} as const;