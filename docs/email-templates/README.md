# Supabase Auth email templates

HTML bodies for the emails Supabase Auth sends on the app's behalf. They are
configuration that lives in the Supabase dashboard, not in the app's build —
this folder is the version-controlled source of truth. Paste them again after
creating a new Supabase project or after anyone edits them in the dashboard.

| File                | Supabase template | Subject                                |
| ------------------- | ----------------- | -------------------------------------- |
| `confirm-signup.html` | Confirm signup    | `Konfirmasi email Anda — Digital Invitation` |
| `reset-password.html` | Reset password    | `Atur ulang kata sandi Digital Invitation`   |

## How to apply

Supabase dashboard → the project → Authentication → Email Templates → pick the
template → set **Subject** → replace the **Message body (source)** with the file's
contents → Save. Do this in the DEV project and the production project.

## Variables used

`{{ .ConfirmationURL }}` (the verification link) and `{{ .Email }}` (the
recipient's own address). The templates deliberately do **not** use
`{{ .Data.full_name }}`: that value is free text typed at sign-up, and anyone
can sign up with someone else's email address, so interpolating it would let
an attacker put their own text in an email that arrives from this app.

## Related settings (same dashboard)

- Authentication → URL Configuration: **Site URL** and **Redirect URLs** must
  contain the deployed origin, otherwise the link falls back to the Site URL
  (default `http://localhost:3000`) and lands on `/?code=...`.
- Sender name/address and the built-in rate limit are controlled by Custom
  SMTP (Project Settings → Authentication → SMTP Settings), not by these
  templates.
