variable "allowed_origin" {
  type    = string
  default = "http://localhost:3000"
}

variable "groq_model" {
  type    = string
  default = "llama-3.1-8b-instant"
}
