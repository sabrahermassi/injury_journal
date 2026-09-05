import os
import sys

import boto3
import jwt
import pytest
from moto import mock_aws

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ.setdefault("DYNAMODB_TABLE", "InjuryEntries")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")
os.environ.setdefault("ALLOWED_ORIGIN", "http://localhost:3000")
os.environ.setdefault("AWS_DEFAULT_REGION", "us-east-1")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")

# A real userId (DynamoDB's key is a string S attribute, but handler.py
# stores str(int(claim)) -- see get_user_id).
TEST_USER_ID = "42"
OTHER_USER_ID = "99"


def make_token(user_id=TEST_USER_ID, secret=None, **claim_overrides):
    """Sign a token the same way backend/src/utils.js createToken does:
    {"userId": <int>}, HS256, against JWT_SECRET."""
    payload = {"userId": int(user_id), **claim_overrides}
    return jwt.encode(payload, secret or os.environ["JWT_SECRET"], algorithm="HS256")


def auth_header(user_id=TEST_USER_ID, **kwargs):
    return {"Authorization": f"Bearer {make_token(user_id, **kwargs)}"}


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
