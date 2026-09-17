# Put this standalone V2 repository on GitHub

Use a **private GitHub repository** while V2 is under development.

```bash
git init
git add .
git commit -m "Deeparture V2 standalone baseline"
git branch -M main
git remote add origin git@github.com:YOUR-ACCOUNT/deeparture-v2.git
git push -u origin main
```

Recommended branches:

- `main` — stable V2 baseline/release candidates
- `develop` — integrated development
- `phase-2-admin-v2` — Admin V2 work
- feature branches for individual changes

Do not commit `.env` files, production credentials, database exports, SMTP passwords, or API keys.
