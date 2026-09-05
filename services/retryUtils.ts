/**
 * Retry utility with exponential backoff for network requests
 */

interface RetryOptions {
    maxRetries?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
};

/**
 * Check if an error is retryable (network errors, 5xx, 429)
 */
const isRetryableError = (error: any): boolean => {
    // Network errors
    if (error?.name === 'TypeError' && error?.message?.includes('Network')) {
        return true;
    }

    // HTTP status codes that warrant retry
    if (error?.status) {
        const status = error.status;
        // Retry on 429 (rate limit), 500-599 (server errors)
        return status === 429 || (status >= 500 && status < 600);
    }

    // AbortError should not be retried
    if (error?.name === 'AbortError') {
        return false;
    }

    return true; // Default to retrying unknown errors
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
): number => {
    // Exponential backoff: baseDelay * 2^attempt
    const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
    // Add jitter (±25%)
    const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);
    // Cap at maxDelay
    return Math.min(jitter, maxDelayMs);
};

/**
 * Wait for a specified duration
 */
const wait = (ms: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute a function with retry logic and exponential backoff
 * @param fetchFn The async function to execute
 * @param options Retry configuration options
 * @returns Promise with the result or throws after all retries exhausted
 */
export async function fetchWithRetry<T>(
    fetchFn: () => Promise<T>,
    options?: RetryOptions
): Promise<T> {
    const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_OPTIONS, ...options };
    const shouldRetry = options?.shouldRetry ?? isRetryableError;

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fetchFn();
        } catch (error) {
            lastError = error;

            // Check if we should retry
            if (attempt < maxRetries && shouldRetry(error)) {
                const delay = calculateDelay(attempt, baseDelayMs, maxDelayMs);
                console.log(`🔄 Retry: Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms...`);
                await wait(delay);
            } else {
                // Don't retry - either max retries reached or non-retryable error
                break;
            }
        }
    }

    console.log(`❌ Retry: All ${maxRetries} attempts exhausted`);
    throw lastError;
}

export { isRetryableError };
