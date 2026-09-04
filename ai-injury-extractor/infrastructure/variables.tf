variable "groq_api_key" {
  type      = string
  sensitive = true
}

variable "allowed_origin" {
  type    = string
  default = "http://localhost:3000"
}

variable "groq_model" {
  type    = string
  default = "openai/gpt-oss-20b"
}