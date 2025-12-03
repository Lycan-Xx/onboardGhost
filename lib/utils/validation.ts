/**
 * Validation utilities
 */

import { ValidationError } from './errors';

/**
 * Validates that a value is not null or undefined
 */
export function required<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined) {
    throw new ValidationError(`${fieldName} is required`);
  }
  return value;
}

/**
 * Validates that a string is not empty
 */
export function notEmpty(value: string, fieldName: string): string {
  if (!value || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`);
  }
  return value;
}

/**
 * Validates repository size (max 500MB)
 */
export function validateRepositorySize(sizeInKB: number): void {
  const MAX_SIZE_KB = 500 * 1024; // 500MB in KB
  if (sizeInKB > MAX_SIZE_KB) {
    throw new ValidationError(
      `Repository exceeds size limit (500MB). Current size: ${Math.round(sizeInKB / 1024)}MB`
    );
  }
}

/**
 * Validates that an object has all required fields
 */
export function validateRequiredFields<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(
    (field) => obj[field] === null || obj[field] === undefined
  );
  
  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
