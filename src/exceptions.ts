/**
 * Base exception class for CreatorsArea errors
 */
export class CreatorsAreaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreatorsAreaError';
    Object.setPrototypeOf(this, CreatorsAreaError.prototype);
  }
}

/**
 * Exception raised when the API request fails
 */
export class APIError extends CreatorsAreaError {
  public readonly statusCode?: number;
  public readonly response?: any;

  constructor(message: string, statusCode?: number, response?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.response = response;
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

/**
 * Exception raised when there's a network error
 */
export class NetworkError extends CreatorsAreaError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Exception raised when response validation fails
 */
export class ValidationError extends CreatorsAreaError {
  constructor(message: string, public readonly data?: any) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
