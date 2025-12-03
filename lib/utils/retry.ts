/**
 * Retry utilities with exponential backoff
 */

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Result of the function
 * @throws Error if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        // Last attempt failed, throw the error
        throw error;
      }
      
      // Calculate exponential backoff delay: baseDelay * 2^i
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Wraps a promise with a timeout
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Error message if timeout occurs
 * @returns Result of the promise
 * @throws Error if timeout occurs
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Executes a function and continues on error with a fallback value
 * @param fn - Function to execute
 * @param fallback - Fallback value if function fails
 * @param logMessage - Message to log on error
 * @returns Result of function or fallback value
 */
export async function continueOnError<T>(
  fn: () => Promise<T>,
  fallback: T,
  logMessage: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(logMessage, error);
    return fallback;
  }
}
