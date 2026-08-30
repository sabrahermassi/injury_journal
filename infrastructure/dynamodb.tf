resource "aws_dynamodb_table" "injury_entries" {
  name         = "InjuryEntries"
  billing_mode = "PAY_PER_REQUEST"

  point_in_time_recovery {
    enabled = true
  }

  hash_key  = "userId"
  range_key = "timestamp"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "S"
  }

  tags = {
    Project     = "ai-injury-extractor"
    Environment = "dev"
  }
}