variable "groq_api_key" {
  type      = string
  sensitive = true
}

# Must be byte-identical to the main app's JWT_SECRET (backend/ issues the
# token, this Lambda verifies it -- see lambda/handler.py get_user_id and
# root CLAUDE.md). Not read from the repo-root .env: this Lambda is fed by
# Terraform, not that file.
variable "jwt_secret" {
  type      = string
  sensitive = true

  validation {
    condition     = length(trimspace(var.jwt_secret)) > 0
    error_message = "jwt_secret must not be empty or whitespace-only."
  }
}

variable "allowed_origin" {
  type    = string
  default = "http://localhost:3000"
}

variable "groq_model" {
  type    = string
  default = "llama-3.1-8b-instant"
}