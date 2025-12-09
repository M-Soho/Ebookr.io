from typing import Optional


class MockAuthMiddleware:
    """
    Development-only middleware that reads `Authorization: Bearer <token>` and
    sets `request.mock_user_id` for downstream views. This simulates a simple
    Supabase-like auth token mapping for local testing.

    Token mapping (dev):
      - mock-token-1 -> user id 1
    """

    TOKEN_MAP = {
        "mock-token-1": 1,
    }

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Only set mock_user_id when a valid mock token is provided.
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
            user_id = self.TOKEN_MAP.get(token)
            if user_id:
                request.mock_user_id = user_id

        return self.get_response(request)
