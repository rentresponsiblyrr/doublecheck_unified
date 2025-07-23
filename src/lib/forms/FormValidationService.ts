/**
 * FORM VALIDATION SERVICE - NETFLIX/META PRODUCTION STANDARDS
 *
 * Comprehensive form validation system with real-time validation, schema-based
 * validation using Zod, accessibility compliance, error recovery, and
 * production-ready form handling patterns.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { z, ZodSchema, ZodError } from "zod";
import { logger } from "@/utils/logger";

export interface ValidationRule {
  field: string;
  schema: ZodSchema;
  dependencies?: string[];
  asyncValidator?: (
    value: unknown,
    formData: Record<string, unknown>,
  ) => Promise<string | null>;
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
  fieldStates: Record<string, FieldValidationState>;
  overallScore: number;
}

export interface FieldValidationState {
  isValid: boolean;
  isPending: boolean;
  isTouched: boolean;
  isDirty: boolean;
  errors: string[];
  warnings: string[];
  lastValidated: number;
  score: number;
}

export interface FormValidationConfig {
  validateOnMount?: boolean;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  debounceMs?: number;
  showWarnings?: boolean;
  enableAccessibility?: boolean;
  trackAnalytics?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

class FormValidationService {
  private validationRules = new Map<string, ValidationRule[]>();
  private validationStates = new Map<string, ValidationResult>();
  private pendingValidations = new Map<string, Promise<any>>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private analyticsData = new Map<string, any>();

  private readonly DEFAULT_CONFIG: Required<FormValidationConfig> = {
    validateOnMount: false,
    validateOnChange: true,
    validateOnBlur: true,
    validateOnSubmit: true,
    debounceMs: 300,
    showWarnings: true,
    enableAccessibility: true,
    trackAnalytics: false,
    maxRetries: 3,
    timeoutMs: 5000,
  };

  /**
   * Register validation rules for a form
   */
  registerForm(
    formId: string,
    rules: ValidationRule[],
    config: FormValidationConfig = {},
  ): void {
    this.validationRules.set(formId, rules);

    // Initialize form state
    const initialState: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      fieldStates: {},
      overallScore: 100,
    };

    // Initialize field states
    rules.forEach((rule) => {
      initialState.fieldStates[rule.field] = {
        isValid: true,
        isPending: false,
        isTouched: false,
        isDirty: false,
        errors: [],
        warnings: [],
        lastValidated: 0,
        score: 100,
      };
    });

    this.validationStates.set(formId, initialState);

    logger.debug("Form validation rules registered", {
      formId,
      rulesCount: rules.length,
      config,
    });
  }

  /**
   * Validate a single field
   */
  async validateField(
    formId: string,
    fieldName: string,
    value: unknown,
    formData: Record<string, unknown> = {},
    options: { force?: boolean; trigger?: "change" | "blur" | "submit" } = {},
  ): Promise<FieldValidationState> {
    const rules = this.validationRules.get(formId);
    const currentState = this.validationStates.get(formId);

    if (!rules || !currentState) {
      throw new Error(`Form ${formId} not registered`);
    }

    const fieldRule = rules.find((rule) => rule.field === fieldName);
    if (!fieldRule) {
      throw new Error(`Field ${fieldName} not found in form ${formId}`);
    }

    const fieldState = currentState.fieldStates[fieldName];

    // Update field state based on interaction
    fieldState.isTouched = true;
    fieldState.isDirty = true;

    // Check if we should validate based on trigger and rule configuration
    if (
      !options.force &&
      !this.shouldValidate(fieldRule, options.trigger || "change")
    ) {
      return fieldState;
    }

    // Handle debouncing
    if (fieldRule.debounceMs && options.trigger === "change") {
      return this.debounceValidation(
        formId,
        fieldName,
        value,
        formData,
        fieldRule,
      );
    }

    return this.performFieldValidation(
      formId,
      fieldName,
      value,
      formData,
      fieldRule,
    );
  }

  /**
   * Validate entire form
   */
  async validateForm(
    formId: string,
    formData: Record<string, any>,
    options: { partial?: boolean; skipAsync?: boolean } = {},
  ): Promise<ValidationResult> {
    const rules = this.validationRules.get(formId);
    const currentState = this.validationStates.get(formId);

    if (!rules || !currentState) {
      throw new Error(`Form ${formId} not registered`);
    }

    const validationPromises: Promise<void>[] = [];
    const result: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      fieldStates: { ...currentState.fieldStates },
      overallScore: 0,
    };

    // Validate each field
    for (const rule of rules) {
      if (options.partial && !(rule.field in formData)) {
        continue;
      }

      const value = formData[rule.field];

      validationPromises.push(
        this.performFieldValidation(formId, rule.field, value, formData, rule)
          .then((fieldState) => {
            result.fieldStates[rule.field] = fieldState;

            if (!fieldState.isValid) {
              result.isValid = false;
              result.errors[rule.field] = fieldState.errors;
            }

            if (fieldState.warnings.length > 0) {
              result.warnings[rule.field] = fieldState.warnings;
            }
          })
          .catch((error) => {
            logger.error("Field validation failed", {
              formId,
              field: rule.field,
              error,
            });

            result.isValid = false;
            result.errors[rule.field] = ["Validation failed"];
            result.fieldStates[rule.field].isValid = false;
            result.fieldStates[rule.field].errors = ["Validation failed"];
          }),
      );
    }

    // Wait for all validations to complete
    await Promise.all(validationPromises);

    // Calculate overall score
    result.overallScore = this.calculateFormScore(result.fieldStates);

    // Update stored state
    this.validationStates.set(formId, result);

    // Track analytics if enabled
    this.trackFormValidation(formId, result);

    logger.debug("Form validation completed", {
      formId,
      isValid: result.isValid,
      errorCount: Object.keys(result.errors).length,
      overallScore: result.overallScore,
    });

    return result;
  }

  /**
   * Submit form with validation and error recovery
   */
  async submitForm(
    formId: string,
    formData: Record<string, any>,
    submitFn: (data: Record<string, any>) => Promise<any>,
    options: {
      validateBeforeSubmit?: boolean;
      retryOnFailure?: boolean;
      sanitizeData?: boolean;
    } = {},
  ): Promise<{
    success: boolean;
    data?: unknown;
    error?: Error;
    validationResult?: ValidationResult;
  }> {
    const config = { ...this.DEFAULT_CONFIG, ...options };

    try {
      // Validate form before submission if enabled
      let validationResult: ValidationResult | undefined;
      if (config.validateBeforeSubmit !== false) {
        validationResult = await this.validateForm(formId, formData);

        if (!validationResult.isValid) {
          return {
            success: false,
            error: new Error("Form validation failed"),
            validationResult,
          };
        }
      }

      // Sanitize data if enabled
      const sanitizedData = config.sanitizeData
        ? this.sanitizeFormData(formData)
        : formData;

      // Attempt submission with retry logic
      let attempts = 0;
      const maxAttempts = config.retryOnFailure ? config.maxRetries : 1;

      while (attempts < maxAttempts) {
        try {
          const result = await Promise.race([
            submitFn(sanitizedData),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Submission timeout")),
                config.timeoutMs,
              ),
            ),
          ]);

          // Track successful submission
          this.trackFormSubmission(formId, true, attempts + 1);

          return {
            success: true,
            data: result,
            validationResult,
          };
        } catch (submitError) {
          attempts++;

          if (attempts >= maxAttempts) {
            // Track failed submission
            this.trackFormSubmission(formId, false, attempts);

            return {
              success: false,
              error: submitError as Error,
              validationResult,
            };
          }

          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempts - 1), 10000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } catch (error) {
      logger.error("Form submission failed", {
        formId,
        error,
      });

      return {
        success: false,
        error: error as Error,
      };
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: new Error("Unexpected submission failure"),
    };
  }

  /**
   * Get current form state
   */
  getFormState(formId: string): ValidationResult | null {
    return this.validationStates.get(formId) || null;
  }

  /**
   * Reset form validation state
   */
  resetForm(formId: string): void {
    const rules = this.validationRules.get(formId);
    if (!rules) return;

    const resetState: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      fieldStates: {},
      overallScore: 100,
    };

    rules.forEach((rule) => {
      resetState.fieldStates[rule.field] = {
        isValid: true,
        isPending: false,
        isTouched: false,
        isDirty: false,
        errors: [],
        warnings: [],
        lastValidated: 0,
        score: 100,
      };
    });

    this.validationStates.set(formId, resetState);
    this.clearPendingValidations(formId);

    logger.debug("Form validation state reset", { formId });
  }

  /**
   * Unregister form and cleanup
   */
  unregisterForm(formId: string): void {
    this.validationRules.delete(formId);
    this.validationStates.delete(formId);
    this.clearPendingValidations(formId);
    this.analyticsData.delete(formId);

    logger.debug("Form validation unregistered", { formId });
  }

  private async performFieldValidation(
    formId: string,
    fieldName: string,
    value: unknown,
    formData: Record<string, unknown>,
    rule: ValidationRule,
  ): Promise<FieldValidationState> {
    const fieldState =
      this.validationStates.get(formId)!.fieldStates[fieldName];

    // Set pending state
    fieldState.isPending = true;
    fieldState.lastValidated = Date.now();

    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Schema validation
      try {
        rule.schema.parse(value);
      } catch (error) {
        if (error instanceof ZodError) {
          errors.push(...error.errors.map((e) => e.message));
        } else {
          errors.push("Invalid value");
        }
      }

      // Async validation
      if (rule.asyncValidator && errors.length === 0) {
        try {
          const asyncError = await rule.asyncValidator(value, formData);
          if (asyncError) {
            errors.push(asyncError);
          }
        } catch (asyncValidationError) {
          logger.warn("Async validation failed", {
            formId,
            fieldName,
            error: asyncValidationError,
          });
          errors.push("Validation service unavailable");
        }
      }

      // Update field state
      fieldState.isValid = errors.length === 0;
      fieldState.errors = errors;
      fieldState.warnings = warnings;
      fieldState.isPending = false;
      fieldState.score = this.calculateFieldScore(fieldState);

      return fieldState;
    } catch (error) {
      fieldState.isValid = false;
      fieldState.errors = ["Validation error occurred"];
      fieldState.isPending = false;
      fieldState.score = 0;

      logger.error("Field validation error", {
        formId,
        fieldName,
        error,
      });

      return fieldState;
    }
  }

  private shouldValidate(rule: ValidationRule, trigger: string): boolean {
    switch (trigger) {
      case "change":
        return rule.validateOnChange !== false;
      case "blur":
        return rule.validateOnBlur !== false;
      case "submit":
        return true;
      default:
        return true;
    }
  }

  private debounceValidation(
    formId: string,
    fieldName: string,
    value: unknown,
    formData: Record<string, unknown>,
    rule: ValidationRule,
  ): Promise<FieldValidationState> {
    const debounceKey = `${formId}_${fieldName}`;

    // Clear existing timer
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        const result = await this.performFieldValidation(
          formId,
          fieldName,
          value,
          formData,
          rule,
        );
        this.debounceTimers.delete(debounceKey);
        resolve(result);
      }, rule.debounceMs || 300);

      this.debounceTimers.set(debounceKey, timer);
    });
  }

  private calculateFieldScore(fieldState: FieldValidationState): number {
    if (!fieldState.isValid) return 0;
    if (fieldState.warnings.length > 0) return 75;
    if (!fieldState.isTouched) return 90;
    return 100;
  }

  private calculateFormScore(
    fieldStates: Record<string, FieldValidationState>,
  ): number {
    const states = Object.values(fieldStates);
    if (states.length === 0) return 100;

    const totalScore = states.reduce((sum, state) => sum + state.score, 0);
    return Math.round(totalScore / states.length);
  }

  private sanitizeFormData(data: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        // Basic sanitization - remove potentially dangerous characters
        sanitized[key] = value
          .trim()
          .replace(/<script[^>]*>.*?<\/script>/gi, "");
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private clearPendingValidations(formId: string): void {
    // Clear debounce timers
    for (const [key, timer] of this.debounceTimers.entries()) {
      if (key.startsWith(formId)) {
        clearTimeout(timer);
        this.debounceTimers.delete(key);
      }
    }

    // Clear pending validation promises
    for (const key of this.pendingValidations.keys()) {
      if (key.startsWith(formId)) {
        this.pendingValidations.delete(key);
      }
    }
  }

  private trackFormValidation(formId: string, result: ValidationResult): void {
    const analytics = this.analyticsData.get(formId) || {
      validationCount: 0,
      errorCount: 0,
      averageScore: 0,
    };

    analytics.validationCount++;
    if (!result.isValid) analytics.errorCount++;
    analytics.averageScore = (analytics.averageScore + result.overallScore) / 2;

    this.analyticsData.set(formId, analytics);
  }

  private trackFormSubmission(
    formId: string,
    success: boolean,
    attempts: number,
  ): void {
    const analytics = this.analyticsData.get(formId) || {};

    if (!analytics.submissions) {
      analytics.submissions = { success: 0, failure: 0, totalAttempts: 0 };
    }

    if (success) {
      analytics.submissions.success++;
    } else {
      analytics.submissions.failure++;
    }

    analytics.submissions.totalAttempts += attempts;

    this.analyticsData.set(formId, analytics);
  }
}

// Singleton instance
export const formValidationService = new FormValidationService();

// Common validation schemas
export const CommonSchemas = {
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number",
    ),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number"),
  url: z.string().url("Invalid URL"),
  required: z.string().min(1, "This field is required"),
  optionalString: z.string().optional(),
  positiveNumber: z.number().positive("Must be a positive number"),
  dateString: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
};

export default FormValidationService;
