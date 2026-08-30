import json
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock


def make_event(body):
    return {
        "httpMethod": "POST",
        "body": json.dumps(body) if body is not None else None,
    }


def make_groq_response(content: dict):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(content)))]
    )


VALID_EXTRACTION = {
    "injury_name": "Sprained ankle",
    "body_area": "ankle",
    "pain_level": 6,
    "symptoms": ["swelling", "bruising"],
    "possible_causes": ["twisted while running"],
}


class TestExtractInjuryValidation:
    def test_missing_text_returns_400(self, handler_module):
        result = handler_module.extract_injury(make_event({}))
        assert result["statusCode"] == 400

    def test_non_dict_body_returns_400(self, handler_module):
        event = {"httpMethod": "POST", "body": json.dumps(["not", "a", "dict"])}
        result = handler_module.extract_injury(event)
        assert result["statusCode"] == 400

    def test_text_too_long_returns_400(self, handler_module):
        event = make_event({"text": "x" * (handler_module.MAX_TEXT_LENGTH + 1)})
        result = handler_module.extract_injury(event)
        assert result["statusCode"] == 400


class TestExtractInjurySuccess:
    def test_valid_response_saved_and_returned(self, handler_module, monkeypatch):
        mock_create = MagicMock(return_value=make_groq_response(VALID_EXTRACTION))
        monkeypatch.setattr(handler_module.client.chat.completions, "create", mock_create)

        result = handler_module.extract_injury(
            make_event({"text": "I twisted my ankle running."})
        )

        assert result["statusCode"] == 200
        assert json.loads(result["body"]) == VALID_EXTRACTION
        mock_create.assert_called_once()

        saved = handler_module.table.scan()["Items"]
        assert len(saved) == 1
        assert saved[0]["extractedData"] == VALID_EXTRACTION
        assert saved[0]["userId"] == "test-user-001"

    def test_fractional_pain_level_saved_and_returned(self, handler_module, monkeypatch):
        fractional = dict(VALID_EXTRACTION, pain_level=6.5)
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(fractional)),
        )

        result = handler_module.extract_injury(
            make_event({"text": "I twisted my ankle running."})
        )

        assert result["statusCode"] == 200
        assert json.loads(result["body"]) == fractional

        saved = handler_module.table.scan()["Items"]
        assert len(saved) == 1
        assert saved[0]["extractedData"]["pain_level"] == Decimal("6.5")


class TestExtractInjuryMalformedAiResponse:
    def test_missing_required_field_returns_502(self, handler_module, monkeypatch):
        bad = dict(VALID_EXTRACTION)
        del bad["body_area"]
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(bad)),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "Invalid AI response format"}

    def test_non_dict_ai_response_returns_502(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(list(VALID_EXTRACTION.keys()))),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "Invalid AI response format"}

    def test_pain_level_out_of_range_returns_502(self, handler_module, monkeypatch):
        bad = dict(VALID_EXTRACTION, pain_level=42)
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(bad)),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502

    def test_symptoms_not_list_of_strings_returns_502(self, handler_module, monkeypatch):
        bad = dict(VALID_EXTRACTION, symptoms=[1, 2])
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(bad)),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502


class TestGetInjuryHistory:
    def test_returns_saved_items(self, handler_module):
        handler_module.table.put_item(
            Item={
                "userId": "test-user-001",
                "timestamp": "2026-08-30T00:00:00+00:00",
                "entryId": "abc-123",
                "rawText": "knee hurts",
                "extractedData": VALID_EXTRACTION,
            }
        )

        result = handler_module.get_injury_history()

        assert result["statusCode"] == 200
        items = json.loads(result["body"])
        assert len(items) == 1
        assert items[0]["entryId"] == "abc-123"

    def test_returns_empty_list_when_no_items(self, handler_module):
        result = handler_module.get_injury_history()

        assert result["statusCode"] == 200
        assert json.loads(result["body"]) == []


class TestLambdaHandlerDispatch:
    def test_unsupported_method_returns_405(self, handler_module):
        result = handler_module.lambda_handler({"httpMethod": "DELETE"}, None)
        assert result["statusCode"] == 405

    def test_post_dispatches_to_extract_injury(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(VALID_EXTRACTION)),
        )

        result = handler_module.lambda_handler(make_event({"text": "hurts"}), None)

        assert result["statusCode"] == 200
        assert json.loads(result["body"]) == VALID_EXTRACTION

    def test_get_dispatches_to_get_injury_history(self, handler_module):
        handler_module.table.put_item(
            Item={
                "userId": "test-user-001",
                "timestamp": "2026-08-30T00:00:00+00:00",
                "entryId": "abc-123",
                "rawText": "knee hurts",
                "extractedData": VALID_EXTRACTION,
            }
        )

        result = handler_module.lambda_handler({"httpMethod": "GET"}, None)

        assert result["statusCode"] == 200
        items = json.loads(result["body"])
        assert len(items) == 1
        assert items[0]["entryId"] == "abc-123"


class TestErrorBranches:
    def test_extract_injury_returns_500_when_groq_call_raises(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(side_effect=RuntimeError("groq unavailable")),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 500
        assert json.loads(result["body"]) == {"error": "Internal server error"}

    def test_extract_injury_returns_502_when_groq_raises_groq_error(self, handler_module, monkeypatch):
        from groq import APIConnectionError

        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(side_effect=APIConnectionError(request=MagicMock())),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "AI service unavailable"}

    def test_extract_injury_returns_502_when_groq_content_not_json(self, handler_module, monkeypatch):
        from types import SimpleNamespace

        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="not json"))]
            )),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "Invalid AI response format"}

    def test_extract_injury_returns_502_when_groq_content_is_none(self, handler_module, monkeypatch):
        from types import SimpleNamespace

        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content=None))]
            )),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "Invalid AI response format"}

    def test_extract_injury_returns_502_when_groq_choices_is_empty(self, handler_module, monkeypatch):
        from types import SimpleNamespace

        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=SimpleNamespace(choices=[])),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 502
        assert json.loads(result["body"]) == {"error": "Invalid AI response format"}

    def test_extract_injury_returns_500_when_dynamodb_put_raises(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(VALID_EXTRACTION)),
        )
        monkeypatch.setattr(
            handler_module.table, "put_item",
            MagicMock(side_effect=RuntimeError("dynamodb unavailable")),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 500
        assert json.loads(result["body"]) == {"error": "Internal server error"}

    def test_extract_injury_returns_500_when_dynamodb_put_raises_client_error(self, handler_module, monkeypatch):
        from botocore.exceptions import ClientError

        monkeypatch.setattr(
            handler_module.client.chat.completions, "create",
            MagicMock(return_value=make_groq_response(VALID_EXTRACTION)),
        )
        monkeypatch.setattr(
            handler_module.table, "put_item",
            MagicMock(side_effect=ClientError(
                {"Error": {"Code": "ProvisionedThroughputExceededException", "Message": "boom"}},
                "PutItem",
            )),
        )

        result = handler_module.extract_injury(make_event({"text": "hurts"}))

        assert result["statusCode"] == 500
        assert json.loads(result["body"]) == {"error": "Failed to save injury data"}

    def test_get_injury_history_returns_500_when_query_raises(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module.table, "query",
            MagicMock(side_effect=RuntimeError("dynamodb unavailable")),
        )

        result = handler_module.get_injury_history()

        assert result["statusCode"] == 500
        assert json.loads(result["body"]) == {"error": "Failed to retrieve injury history"}

    def test_lambda_handler_returns_500_when_dispatch_raises(self, handler_module, monkeypatch):
        monkeypatch.setattr(
            handler_module, "extract_injury",
            MagicMock(side_effect=RuntimeError("unexpected")),
        )

        result = handler_module.lambda_handler(make_event({"text": "hurts"}), None)

        assert result["statusCode"] == 500
        assert json.loads(result["body"]) == {"error": "Internal server error"}
