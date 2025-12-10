# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e4]: Welcome back
    - generic [ref=e5]: Sign in to access your dashboard
  - generic [ref=e6]:
    - generic [ref=e7]:
      - generic [ref=e8]: Email
      - textbox "Email" [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]: Password
      - generic [ref=e12]:
        - textbox "Password" [ref=e13]
        - button "Show" [ref=e14] [cursor=pointer]
    - button "Sign In" [ref=e15] [cursor=pointer]
    - paragraph [ref=e16]: You’ll be redirected based on your role (student / instructor).
  - generic [ref=e17]:
    - text: Don’t have an account?
    - link "Create one" [ref=e18] [cursor=pointer]:
      - /url: /register
```