# Container only — deliberately no aws_secretsmanager_secret_version, and no
# data-source read of the value anywhere in this config. Either would write the
# key into terraform.tfstate in plaintext, which is the bug this exists to fix
# (issue #36). Populate it out of band, once, with:
#
#   aws secretsmanager put-secret-value \
#     --secret-id injury-extractor/groq-api-key \
#     --secret-string 'gsk_...'
resource "aws_secretsmanager_secret" "groq_api_key" {
  name = "injury-extractor/groq-api-key"

  # Dev project (see provider.tf): allow immediate delete so the name can be
  # reused right away. The default 30-day recovery window would block re-apply.
  recovery_window_in_days = 0

  tags = {
    Project     = "ai-injury-extractor"
    Environment = "dev"
  }
}
