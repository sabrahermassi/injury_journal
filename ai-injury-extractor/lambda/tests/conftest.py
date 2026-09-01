import os
import sys

import boto3
import pytest
from moto import mock_aws

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("DYNAMODB_TABLE", "InjuryEntries")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("ALLOWED_ORIGIN", "http://localhost:3000")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")


@pytest.fixture
def handler_module():
    """Import handler.py inside an active moto mock so its module-level
    boto3.resource("dynamodb") and Table() calls are sandboxed, and create
    the table it expects to exist."""
    with mock_aws():
        boto3.client("dynamodb", region_name="us-east-1").create_table(
            TableName=os.environ["DYNAMODB_TABLE"],
            KeySchema=[
                {"AttributeName": "userId", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "userId", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )

        sys.modules.pop("handler", None)
        import handler

        yield handler

        sys.modules.pop("handler", None)
