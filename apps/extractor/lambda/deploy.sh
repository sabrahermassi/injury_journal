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


echo "Deployment complete!"