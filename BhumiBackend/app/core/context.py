from contextvars import ContextVar

# Set per-request in RequestLoggingMiddleware; auto-injected into every log record via ContextFilter.
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

# Set in get_current_farmer / get_current_admin after token validation succeeds.
user_id_var: ContextVar[str] = ContextVar("user_id", default="-")
