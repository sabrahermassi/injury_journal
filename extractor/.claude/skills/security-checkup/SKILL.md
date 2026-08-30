I already have a software security implementation plan for this application.

Do not implement anything and do not modify any files.

Act as a senior software security engineer and critically review my plan.

Your goal is to identify what I may be missing, what risks I may be underestimating, and whether
the order and scope of the plan make sense.

Consider the major areas of modern application security, including where relevant:

- Authentication
- Authorization and access control
- User/data isolation
- Input validation
- Injection vulnerabilities
- XSS
- CSRF
- CORS
- Session and token security
- API security
- Rate limiting and abuse prevention
- Secrets and credential management
- Sensitive data exposure
- Logging and error handling
- SSRF
- Path traversal
- Command/code injection
- Dependency and supply-chain security
- Database security
- Encryption in transit and at rest
- Secure configuration
- Least privilege
- Infrastructure and deployment security (this app is serverless: Lambda, API Gateway, DynamoDB,
  Terraform — consider IAM least privilege, API Gateway throttling/usage plans, and Lambda
  environment variable exposure specifically)
- Resource exhaustion / DoS
- LLM-specific risks: prompt injection, unvalidated model output being trusted/stored (this app
  calls Groq and stores the raw response)
- Security monitoring and auditing
- Security testing
- Privacy and data retention (this app stores free-text health-adjacent data — injury
  descriptions — in DynamoDB)
- Third-party integrations and trust boundaries (Groq API)

Also consider OWASP Top 10 and other commonly recognized application-security risks where
relevant.

Do not assume every category applies. Focus on risks that are relevant to the actual application
and explain why.

Before evaluating, check whether the risk is already tracked as a known/accepted limitation in
this repo (e.g. `/injuries` and `/extract` being unauthenticated is a documented dev-only choice —
see README "Integration" and `docs/lambda-design.md`) versus something newly introduced by the
plan.

For every missing security item, tell me:

- What I am missing
- Why it matters
- What risk it addresses
- Priority: HIGH / MEDIUM / LOW
- Whether it should be added to my plan

Also identify anything in my plan that is:
- redundant
- unnecessarily complex
- too vague
- in the wrong order
- missing an associated verification step

Do not implement fixes.
Do not modify files.
Do not create GitHub issues.
Do not commit or push.

At the end, give me a concise list titled:

## Recommended Additions

containing only the security items you believe should actually be added to my plan.

Here is my security plan:

[PASTE SECURITY PLAN HERE]
