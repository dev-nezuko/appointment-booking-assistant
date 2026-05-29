"""
Tests for the keyless chat model and provider selection.

Two things are being pinned. First, that extraction is *conservative*: a
booking assistant that invents a time is worse than one that asks, so anything
ambiguous must come back as None and let the flow request it. Second, that
provider selection cannot silently send traffic to a vendor — or silently fail
to.
"""

from __future__ import annotations

from datetime import datetime

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel

from llm.local_model import (
    LocalChatModel,
    compose_reply,
    extract_date,
    extract_intent,
    extract_service,
    extract_time,
)
from llm.provider import LLMProvider

# A Wednesday, so weekday arithmetic is checkable by hand.
TODAY = datetime(2026, 3, 4)


class TestDateExtraction:
    @pytest.mark.parametrize(
        "text,expected",
        [
            ("book me for 2026-03-14", "2026-03-14"),
            ("can I come today?", "2026-03-04"),
            ("how about tomorrow", "2026-03-05"),
            ("friday works", "2026-03-06"),
            ("next friday please", "2026-03-13"),
            ("March 20 if possible", "2026-03-20"),
            ("20 March if possible", "2026-03-20"),
        ],
    )
    def test_it_reads_the_dates_people_type(self, text, expected):
        assert extract_date(text, TODAY) == expected

    def test_a_month_already_past_rolls_to_next_year(self):
        # "January 5" said in March means next January.
        assert extract_date("january 5", TODAY) == "2027-01-05"

    def test_no_date_mentioned_returns_none(self):
        # Not a default, not today — None, so the flow asks.
        assert extract_date("I need an appointment", TODAY) is None


class TestTimeExtraction:
    @pytest.mark.parametrize(
        "text,expected",
        [
            ("2pm", "14:00"),
            ("2 pm please", "14:00"),
            ("2:30pm", "14:30"),
            ("14:30", "14:30"),
            ("9am", "09:00"),
            ("12pm", "12:00"),
            ("12am", "00:00"),
            ("at 3", "15:00"),
            ("at 10", "10:00"),
        ],
    )
    def test_it_reads_the_times_people_type(self, text, expected):
        assert extract_time(text) == expected

    def test_a_date_is_not_mistaken_for_a_time(self):
        # "2026-03-14" contains digits that a loose pattern reads as 03:14.
        assert extract_time("book me on 2026-03-14") is None

    def test_no_time_mentioned_returns_none(self):
        assert extract_time("sometime next week") is None


class TestServiceAndIntent:
    @pytest.mark.parametrize(
        "text,expected",
        [
            ("I need a consultation", "Consultation"),
            ("just a follow-up", "Follow-up"),
            ("a check up please", "Check-up"),
            ("teeth cleaning", "Cleaning"),
        ],
    )
    def test_service_words(self, text, expected):
        assert extract_service(text) == expected

    def test_an_unknown_service_is_not_guessed(self):
        assert extract_service("I need the thing with the laser") is None

    @pytest.mark.parametrize(
        "text,expected",
        [
            ("I want to book something", "book_appointment"),
            ("please cancel it", "cancel"),
            ("can I reschedule", "reschedule"),
            ("yes", "confirm"),
        ],
    )
    def test_intent(self, text, expected):
        assert extract_intent(text) == expected


class TestReplies:
    def test_it_asks_for_exactly_what_is_missing(self):
        reply = compose_reply("I'd like a consultation", TODAY)
        assert "Consultation" in reply
        assert "date" in reply and "time" in reply

    def test_it_asks_for_one_thing_when_only_one_is_missing(self):
        reply = compose_reply("consultation tomorrow", TODAY)
        assert "time" in reply
        assert "date" not in reply

    def test_it_offers_to_confirm_once_everything_is_known(self):
        reply = compose_reply("consultation tomorrow at 2pm", TODAY)
        assert "confirm" in reply.lower()

    def test_a_greeting_is_answered_as_a_greeting(self):
        assert compose_reply("hello", TODAY).startswith("Hello")

    def test_replies_are_deterministic(self):
        # The same input must produce the same output, or the tests above are
        # measuring luck.
        assert compose_reply("consultation friday at 3pm", TODAY) == compose_reply(
            "consultation friday at 3pm", TODAY
        )


class TestModelInterface:
    def test_it_answers_an_invoke(self):
        result = LocalChatModel().invoke([HumanMessage(content="hello")])
        assert isinstance(result, AIMessage)
        assert result.content

    def test_it_reads_the_latest_human_turn_not_the_last_message(self):
        model = LocalChatModel()
        result = model.invoke(
            [
                HumanMessage(content="hello"),
                AIMessage(content="Hello. What service do you need?"),
                HumanMessage(content="a consultation tomorrow at 2pm"),
            ]
        )
        assert "confirm" in str(result.content).lower()

    def test_structured_output_fills_the_schema(self):
        class Extraction(BaseModel):
            date: str | None = None
            time: str | None = None
            service_type: str | None = None
            intent: str | None = None

        runnable = LocalChatModel().with_structured_output(Extraction)
        out = runnable.invoke("book a consultation on 2026-03-14 at 2pm")

        assert out.date == "2026-03-14"
        assert out.time == "14:00"
        assert out.service_type == "Consultation"
        assert out.intent == "book_appointment"


class TestProviderSelection:
    def test_no_key_selects_the_local_model(self, monkeypatch):
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.setenv("LLM_PROVIDER", "auto")
        assert LLMProvider().is_local()

    def test_a_placeholder_key_is_not_a_key(self, monkeypatch):
        # The exact failure a first-time user hits: copy .env.example, run,
        # and get a 401 from the vendor instead of a working system.
        monkeypatch.setenv("LLM_PROVIDER", "auto")
        monkeypatch.setenv("OPENAI_API_KEY", "your-openai-api-key-here")
        assert LLMProvider().is_local()

    def test_an_empty_key_is_not_a_key(self, monkeypatch):
        monkeypatch.setenv("LLM_PROVIDER", "auto")
        monkeypatch.setenv("OPENAI_API_KEY", "   ")
        assert LLMProvider().is_local()

    def test_asking_for_openai_without_a_key_fails_loudly(self, monkeypatch):
        # Explicitly requesting a vendor must not silently downgrade to local.
        monkeypatch.setenv("LLM_PROVIDER", "openai")
        monkeypatch.setenv("OPENAI_API_KEY", "your-key-here")
        with pytest.raises(ValueError, match="placeholder"):
            LLMProvider()

    def test_an_unknown_provider_names_the_valid_ones(self, monkeypatch):
        monkeypatch.setenv("LLM_PROVIDER", "llama")
        with pytest.raises(ValueError, match="local"):
            LLMProvider()


class TestNextWeekday:
    """The 'next Friday' bug: the offset was already non-zero, so `ahead or 7`
    left it pointing at *this* Friday."""

    def test_next_weekday_is_the_following_week(self):
        wednesday = datetime(2026, 3, 4)
        assert extract_date("friday", wednesday) == "2026-03-06"
        assert extract_date("next friday", wednesday) == "2026-03-13"

    def test_next_weekday_said_on_that_weekday_is_seven_days(self):
        friday = datetime(2026, 3, 6)
        assert extract_date("next friday", friday) == "2026-03-13"

    def test_a_weekday_said_on_that_weekday_means_the_next_one(self):
        friday = datetime(2026, 3, 6)
        assert extract_date("friday", friday) == "2026-03-13"
