import os
import sys

import boto3
import pytest
from moto import mock_aws

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("DYNAMODB_TABLE", "InjuryEntries")
os.environ.setdefault("ALLOWED_ORIGIN", "http://localhost:3000")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")

GROQ_SECRET_NAME = "injury-extractor/groq-api-key"
GROQ_SECRET_VALUE = "test-groq-key"


@pytest.fixture
def handler_module(monkeypatch):
    """Import handler.py inside an active moto mock so its module-level
    boto3.resource("dynamodb") / Table() and Secrets Manager calls are
    sandboxed, and create the table and secret it expects to exist.

    GROQ_SECRET_ARN is set from the ARN moto returns rather than to the bare
    name, so tests resolve the secret the same way the deployed Lambda does —
    Terraform passes it the ARN (infrastructure/lambda.tf)."""
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

        secret = boto3.client("secretsmanager", region_name="us-east-1").create_secret(
            Name=GROQ_SECRET_NAME,
            SecretString=GROQ_SECRET_VALUE,
        )
        monkeypatch.setenv("GROQ_SECRET_ARN", secret["ARN"])

        sys.modules.pop("handler", None)
        import handler

        yield handler

        sys.modules.pop("handler", None)
