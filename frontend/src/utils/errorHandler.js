/**
 * Extract error message from axios error object
 * Handles different response formats and error scenarios
 */
export const getErrorMessage = (
  error,
  defaultMessage = "An error occurred",
) => {
  // Log full error for debugging
  console.error("Error object:", error);

  // Check if it's an axios error with response
  if (error.response) {
    console.error("Response status:", error.response.status);
    console.error("Response data:", error.response.data);

    // Try common message field names
    if (error.response.data?.message) {
      return error.response.data.message;
    }

    if (error.response.data?.error) {
      return error.response.data.error;
    }

    // If data is a string (HTML error page), return generic message
    if (typeof error.response.data === "string") {
      console.error("Response is HTML/string, likely an unexpected error page");
      return defaultMessage;
    }

    // Try to stringify the response data if it's an object
    if (error.response.data && typeof error.response.data === "object") {
      console.error("Unexpected response structure:", error.response.data);
      return JSON.stringify(error.response.data);
    }

    // Fall back to status code message
    return `Error: ${error.response.status} ${error.response.statusText}`;
  }

  // Network error or no response
  if (error.request && !error.response) {
    console.error("No response received:", error.request);
    return "Network error - unable to reach server";
  }

  // Error in request setup
  if (error.message) {
    return error.message;
  }

  return defaultMessage;
};
