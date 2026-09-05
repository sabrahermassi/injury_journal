variable "groq_api_key" {
  type      = string
  sensitive = true
}

variable "groq_model" {
  type    = string
  default = "openai/gpt-oss-20b"
}

# Proves the caller is the journal backend. Nothing else may reach this API.
# Set via TF_VAR_extractor_shared_secret; the same value goes in the backend's
# EXTRACTOR_SHARED_SECRET.
variable "extractor_shared_secret" {
  type      = string
  sensitive = true

  validation {
    condition     = length(trimspace(var.extractor_shared_secret)) > 0
    error_message = "extractor_shared_secret must not be empty or whitespace-only."
  }
}
