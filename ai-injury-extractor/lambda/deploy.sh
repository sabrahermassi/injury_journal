#!/bin/bash

set -e

echo "Installing dependencies..."

rm -rf package
mkdir package

pip install \
  -r requirements.txt \
  -t package \
  --platform manylinux2014_x86_64 \
  --implementation cp \
  --python-version 3.12 \
  --only-binary=:all:

echo "Creating Lambda package..."

rm -f function.zip

python - <<EOF
import zipfile
import os

with zipfile.ZipFile("function.zip", "w") as z:

    # Add dependencies
    for root, dirs, files in os.walk("package"):
        for file in files:
            path = os.path.join(root, file)
            z.write(path, os.path.relpath(path, "package"))

    # Add Lambda handler
    z.write("handler.py")

print("function.zip created")
EOF


echo "Deploying infrastructure..."

cd ../infrastructure

terraform apply -auto-approve


# The Groq key is not managed by Terraform (it would land in the state file in
# plaintext), so a fresh stack has an empty secret and the Lambda fails at
# initialization until the value is written. Warn rather than fail: an empty
# secret is the expected state on a fresh stack, and the warning below says how
# to fill it.
GROQ_SECRET_ID="injury-extractor/groq-api-key"

if ! secret_string="$(aws secretsmanager get-secret-value \
  --secret-id "$GROQ_SECRET_ID" \
  --query SecretString --output text 2>/dev/null)"; then
  secret_string=""
fi

if [[ -z "$secret_string" || "$secret_string" == "None" ]]; then

  echo
  echo "WARNING: no value stored for the Groq API key. The Lambda will fail to"
  echo "initialize and every request will return a 502 until you run:"
  echo
  echo "  aws secretsmanager put-secret-value \\"
  echo "    --secret-id injury-extractor/groq-api-key \\"
  echo "    --secret-string 'YOUR_GROQ_KEY'"
  echo
fi


echo "Deployment complete!"