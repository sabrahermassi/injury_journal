# Terraform state is local (.tfstate, gitignored) by design for this solo
# demo project. If this grows to multiple contributors/machines, add an S3
# backend (with a DynamoDB lock table) here and run
# `terraform init -migrate-state` to move existing state over.
# Tracked as GitHub issue #18.
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}