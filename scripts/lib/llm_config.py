"""Shared LLM configuration with automatic failover: Z.AI/GLM → NVIDIA NIM → OpenRouter.

All Python LLM calls should use completion_with_failover() instead of calling
directly. Tries Z.AI first (paid, via Anthropic-compatible proxy), then
NVIDIA NIM, then OpenRouter as last resort.
"""

import os

from anthropic import Anthropic
import litellm

ZAI_ANTHROPIC_BASE = "https://api.z.ai/api/anthropic"
ZAI_MODEL = "glm-5.1"

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Model name mapping for OpenRouter fallback
MODEL_MAP = {
    "meta/llama-3.3-70b-instruct": "meta-llama/llama-3.3-70b-instruct",
}


def _clean_key(env_var: str) -> str:
    return os.environ.get(env_var, "").strip().strip("\"'")


def get_api_key(provider: str = "zai") -> str:
    """Get API key for the given provider."""
    if provider == "zai":
        return _clean_key("ZAI_API_KEY")
    elif provider == "nvidia_nim":
        return _clean_key("NVIDIA_NIM_API_KEY") or _clean_key("NVIDIA_API_KEY")
    elif provider == "openrouter":
        return _clean_key("OPENROUTER_API_KEY")
    return ""


def _is_rate_limit(err: Exception) -> bool:
    """Check if an error is a rate limit (429)."""
    msg = str(err).lower()
    return "429" in msg or "too many requests" in msg or "rate" in msg


def completion_with_failover(
    *,
    messages: list[dict],
    system: str | None = None,
    model_id: str | None = None,
    purpose: str = "discover",
    max_tokens: int = 200,
    temperature: float = 0.3,
    api_key: str | None = None,
) -> tuple:
    """Call LLM with automatic provider failover.

    Priority: Z.AI/GLM (Anthropic proxy) → NVIDIA NIM → OpenRouter.
    Returns (response_text, provider_used).
    """
    model = model_id or ZAI_MODEL

    # For litellm-based fallbacks, fold system into messages
    litellm_messages = list(messages)
    if system and not any(m.get("role") == "system" for m in litellm_messages):
        litellm_messages = [{"role": "system", "content": system}] + litellm_messages

    # Try Z.AI first via Anthropic-compatible proxy
    zai_key = api_key or get_api_key("zai")
    if zai_key:
        try:
            client = Anthropic(api_key=zai_key, base_url=ZAI_ANTHROPIC_BASE)
            kwargs = dict(model=model, max_tokens=max_tokens, messages=messages)
            if system:
                kwargs["system"] = system
            resp = client.messages.create(**kwargs)
            return resp.content[0].text, "zai"
        except Exception as e:
            if not _is_rate_limit(e):
                raise
            print("  Failover: Z.AI rate limited, trying NVIDIA NIM")

    # Fallback: NVIDIA NIM
    nvidia_key = get_api_key("nvidia_nim")
    if nvidia_key:
        try:
            nvidia_model = "meta/llama-3.3-70b-instruct"
            resp = litellm.completion(
                model=f"nvidia_nim/{nvidia_model}",
                messages=litellm_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                api_key=nvidia_key,
                api_base=NVIDIA_BASE_URL,
            )
            return resp.choices[0].message.content, "nvidia_nim"
        except Exception as e:
            if not _is_rate_limit(e):
                raise
            print("  Failover: NVIDIA rate limited, trying OpenRouter")

    # Last resort: OpenRouter
    or_key = get_api_key("openrouter")
    if or_key:
        or_model = MODEL_MAP.get("meta/llama-3.3-70b-instruct", "meta-llama/llama-3.3-70b-instruct")
        resp = litellm.completion(
            model=f"openrouter/{or_model}",
            messages=litellm_messages,
            max_tokens=max_tokens,
            temperature=temperature,
            api_key=or_key,
        )
        return resp.choices[0].message.content, "openrouter"

    raise RuntimeError(
        "No LLM provider configured. Set ZAI_API_KEY, NVIDIA_NIM_API_KEY, or OPENROUTER_API_KEY."
    )
