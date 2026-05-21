# The Intelligent Shield

OpenCTI deployment assets and documentation for AI-driven threat intelligence enrichment with Claude.

This repository contains:

- Docker Compose files for the OpenCTI core stack and connectors.
- A custom `connectors/ai-enrichment` internal enrichment connector.
- A Docusaurus documentation site in `docs-site/` based on the Medium article, with local copies of the article infographics and screenshots.
- A sanitized `.env.example` for local setup.

## Safety

The real `.env`, local Claude settings, and token scratch files are intentionally ignored by Git. Create a local `.env` from `.env.example` and fill in your own values.

## Documentation Site

The Docusaurus site is published with GitHub Pages:

- Live site: https://anpa1200.github.io/opencti-intelligent-shield/
- Main guide: https://anpa1200.github.io/opencti-intelligent-shield/docs/intelligent-shield
- Source: [docs-site](docs-site/)

The site is generated from the published Medium article, with all article infographics and screenshots stored locally under [docs-site/static/img/article](docs-site/static/img/article/). GitHub Actions builds and deploys it automatically on pushes to `main` that touch `docs-site/`.

Run the documentation locally:

```bash
cd docs-site
npm install
npm run build
npm start
```

The local article page is available at `/docs/intelligent-shield`.

## OpenCTI Stack

Clone and configure:

```bash
cd /home/andrey
git clone https://github.com/anpa1200/opencti-intelligent-shield.git openCTI
cd openCTI
cp .env.example .env
nano .env
```

Fast start everything:

```bash
./scripts/start-all.sh
```

Stop everything while preserving volumes:

```bash
./scripts/stop-all.sh
```

Manual startup:

```bash
docker compose up -d
docker compose -f docker-compose.connectors.yml up -d
docker compose -f docker-compose.ai.yml up -d --build
```

Use the deployment guide for full configuration and operational notes.
