"""Shared rate limiter instance.

Held in its own module so both the app (main.py) and the individual route
modules can reference the same Limiter without creating circular imports.
The configured limits themselves live in app.config.Settings.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
