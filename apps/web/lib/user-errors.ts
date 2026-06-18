const PROFILE_LOAD_MESSAGE =
  "We were unable to load your account information. Please try again later or contact support if the issue persists.";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

const AUTH_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "The email address or password you entered is incorrect.",
  "Email not confirmed": "Please confirm your email before signing in.",
  "User already registered": "An account with this email already exists. Try logging in instead.",
  "Signup requires a valid password": "Please choose a stronger password (at least 8 characters).",
  "Token has expired or is invalid": "This code has expired. Request a new one and try again.",
  "Email rate limit exceeded": "Too many attempts. Please wait a few minutes and try again."
};

export function mapSupabaseError(
  error: { message?: string; code?: string } | string | null | undefined,
  context?: "auth" | "profile" | "signup" | "password" | "email_change" | "generic"
): string {
  const message = typeof error === "string" ? error : error?.message ?? "";
  const code = typeof error === "string" ? "" : error?.code ?? "";
  const combined = `${message} ${code}`.toLowerCase();

  if (combined.includes("infinite recursion")) {
    return PROFILE_LOAD_MESSAGE;
  }

  if (combined.includes("row-level security") || combined.includes("permission denied")) {
    if (context === "profile") return PROFILE_LOAD_MESSAGE;
    if (context === "signup") {
      return "Your account was created but sign-in did not complete. Try signing in, or confirm your email first.";
    }
    return "You do not have permission to perform this action.";
  }

  if (message && AUTH_MESSAGES[message]) {
    return AUTH_MESSAGES[message];
  }

  if (context === "auth" && message === "Invalid login credentials") {
    return AUTH_MESSAGES["Invalid login credentials"];
  }

  if (context === "profile") {
    return PROFILE_LOAD_MESSAGE;
  }

  if (context === "signup" && message.toLowerCase().includes("otp")) {
    return "We could not verify that code. Check the number and try again.";
  }

  if (context === "password") {
    if (message === "Token has expired or is invalid") {
      return AUTH_MESSAGES["Token has expired or is invalid"];
    }
    if (message.toLowerCase().includes("otp") || code === "otp_expired") {
      return "This code has expired. Request a new one and try again.";
    }
    return "We could not update your password. Please try again.";
  }

  if (context === "email_change") {
    if (message === "User already registered" || combined.includes("already been registered")) {
      return AUTH_MESSAGES["User already registered"];
    }
    if (message === "Token has expired or is invalid") {
      return AUTH_MESSAGES["Token has expired or is invalid"];
    }
    if (message.toLowerCase().includes("otp") || code === "otp_expired") {
      return "This code has expired. Request a new one and try again.";
    }
    if (message === "Email rate limit exceeded") {
      return AUTH_MESSAGES["Email rate limit exceeded"];
    }
    return "We could not update your email. Please try again.";
  }

  if (!message) {
    return GENERIC_MESSAGE;
  }

  return GENERIC_MESSAGE;
}
