# The Intelligent Shield — AI-Powered CTI Platform

> Full deployment guide and assets for running OpenCTI with AI-driven enrichment using Claude.

**Live documentation:** [1200km.com/opencti-intelligent-shield](https://1200km.com/opencti-intelligent-shield/)  
**Main guide:** [/docs/intelligent-shield](https://1200km.com/opencti-intelligent-shield/docs/intelligent-shield)  
**Medium article:** [The Intelligent Shield](https://medium.com/@1200km/the-intelligent-shield-057c9b4b9394)

---

## What This Is

This repository deploys OpenCTI as a fully operational threat intelligence platform with:

- **STIX 2.1 knowledge graph** — every threat actor, malware, indicator, and ATT&CK technique stored as typed, relationship-linked STIX objects
- **Free and commercial feed connectors** — MITRE ATT&CK, CVE/NVD, AlienVault OTX, Abuse.ch, VirusTotal, Mandiant, Recorded Future, ISAC/government TAXII feeds
- **Claude AI enrichment connector** — custom Python connector that reads ingested reports, extracts entities with the Anthropic API, maps them to STIX relationships, and writes them back automatically
- **OpenCTI inference rules** — automatic relationship creation from attribution chains, sightings, and ATT&CK parent/sub-technique hierarchies
- **TAXII 2.x output** — push curated indicator collections to SIEM, NGFW, or EDR platforms

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      OpenCTI Stack                          │
│                                                             │
│  OpenCTI Platform (Node.js)  ←→  RabbitMQ (message broker) │
│         ↕                              ↕                    │
│  ElasticSearch (search)      Connectors (Python workers)    │
│  JanusGraph (graph)          ├── MITRE ATT&CK               │
│  MinIO (file store)          ├── CVE / NVD                  │
│  Redis (cache)               ├── AlienVault OTX             │
│         ↕                   ├── Abuse.ch                    │
│  TAXII 2.x Server            ├── Shodan                     │
│  GraphQL / REST API          └── Claude AI enrichment       │
└─────────────────────────────────────────────────────────────┘
```

**Hardware requirements:**
- Minimum: 8 cores / 16 GB RAM / 200 GB SSD
- Recommended: 16 cores / 32 GB RAM / 1 TB NVMe

---

## Repository Contents

```
opencti-intelligent-shield/
├── docker-compose.yml              # Core stack (OpenCTI + ES + MinIO + Redis + RabbitMQ)
├── docker-compose.connectors.yml   # Standard connectors (MITRE, CVE, OTX, Abuse.ch)
├── docker-compose.ai.yml           # AI enrichment connector
├── docker-compose.kibana.yml       # Optional Kibana for ES visualization
├── connectors/
│   └── ai-enrichment/              # Custom Claude connector (Python + pycti)
│       ├── Dockerfile
│       ├── connector.py            # Main connector logic
│       └── requirements.txt
├── scripts/
│   ├── start-all.sh                # Start all three stacks in order
│   └── stop-all.sh                 # Stop all stacks, preserve volumes
├── terraform/                      # Optional cloud infrastructure
├── .env.example                    # Template — copy to .env and fill values
└── docs-site/                      # Docusaurus documentation site
    ├── docs/
    │   └── intelligent-shield.md   # Full guide (780 lines, 31 screenshots)
    └── static/img/article/         # All 31 article infographics and screenshots
```

---

## Quick Start

```bash
git clone https://github.com/anpa1200/opencti-intelligent-shield.git openCTI
cd openCTI
cp .env.example .env
nano .env   # fill OPENCTI_ADMIN_TOKEN, ELASTIC_PASSWORD, ANTHROPIC_API_KEY, etc.
```

Start all three stacks:

```bash
./scripts/start-all.sh
```

Or manually in order (wait 60s after core for ElasticSearch to initialize):

```bash
docker compose up -d
docker compose -f docker-compose.connectors.yml up -d
docker compose -f docker-compose.ai.yml up -d --build
```

OpenCTI UI: `http://localhost:8080`

Stop without destroying data:

```bash
./scripts/stop-all.sh
```

---

## Claude AI Enrichment Connector

The `connectors/ai-enrichment` connector subscribes to the RabbitMQ queue for newly ingested reports (text/HTML, PDF). For each report it:

1. **Extracts entities** — threat actors, malware, IOCs, ATT&CK techniques, CVEs, campaigns
2. **Infers relationships** — `actor → uses → malware`, `malware → uses → technique`, `indicator → indicates → actor`
3. **Writes back to OpenCTI** — as native STIX 2.1 objects via GraphQL API, with confidence scores and source references

```python
# Simplified extraction flow
message = anthropic_client.messages.create(
    model="claude-haiku-4-5-20251001",   # cost-efficient for high-volume enrichment
    max_tokens=4096,
    messages=[{"role": "user", "content": EXTRACTION_PROMPT.format(report=report_text)}]
)
entities = json.loads(message.content[0].text)
# → create STIX objects for each entity + relationship
```

Use `claude-haiku-4-5-20251001` for continuous enrichment (low cost, fast). Switch to `claude-sonnet-4-6` for high-priority reports.

---

## Intelligence Feeds

| Tier | Feed | Connector |
|------|------|-----------|
| Free | MITRE ATT&CK | `opencti/connector-mitre` |
| Free | CVE / NVD | `opencti/connector-cve` |
| Free | AlienVault OTX | `opencti/connector-alienvault` |
| Free | Abuse.ch | `opencti/connector-abuse-threat-fox` |
| Free | Shodan | `opencti/connector-shodan` |
| Commercial | VirusTotal | `opencti/connector-virustotal` |
| Commercial | Mandiant | `opencti/connector-mandiant` |
| Commercial | Recorded Future | `opencti/connector-recordedfuture` |
| ISAC/Gov | CISA AIS | TAXII client |
| ISAC/Gov | NATO MISP | MISP connector |
| Custom | Claude AI | This repo — `connectors/ai-enrichment` |

---

## Security

Before connecting to a network or adding real feeds:

- Change `OPENCTI_ADMIN_TOKEN`, `OPENCTI_ADMIN_PASSWORD`, and `ELASTIC_PASSWORD` in `.env`
- Run behind an nginx/Traefik reverse proxy with TLS (never expose port 8080 directly)
- Set `xpack.security.enabled=true` in ElasticSearch configuration
- Restrict RabbitMQ management UI (port 15672) to localhost
- Configure TLP markings at the connector level before feeds go live

The real `.env`, local tokens, and scratch files are gitignored. Never commit credentials.

---

## Documentation

The Docusaurus site at [docs-site/](docs-site/) is published via GitHub Pages.

Run locally:

```bash
cd docs-site
npm install
npm start
```

The main guide ([intelligent-shield.md](docs-site/docs/intelligent-shield.md)) covers:

- Full architecture walkthrough
- Feed setup with TLP assignment
- Three Docker Compose stacks with complete YAML
- Claude connector internals and prompt engineering
- Inference rules (6 rules, plain-language explanation)
- 9-step security hardening checklist
- Monitoring: RabbitMQ queues, ElasticSearch heap, connector health
- 5 investigation workflows: threat actor profiling, report ingestion, IOC pivoting, CVE research, incident response
- All 31 article infographics and screenshots placed at correct content positions

---

## Ecosystem

This project is part of the [1200KM.COM](https://1200km.com/) CTI practitioner ecosystem:

| Project | Role |
|---------|------|
| [CTI Analyst Field Manual](https://1200km.com/cti-analyst-field-manual/) | The tradecraft standard — evidence discipline, attribution methodology, CTI-to-detection chain |
| [Operation Desert Hydra](https://1200km.com/operation-desert-hydra/) | Full pipeline case study — OpenCTI knowledge graph used for MuddyWater detection coverage |
| [Israel Threat Actors CTI](https://1200km.com/israel-government-threat-actors-cti/) | 22 structured actor profiles (Iranian, Palestinian, Israeli-nexus) for OpenCTI import |
| [Customer-Driven AI CTI](https://1200km.com/customer-driven-ai-cti-project/) | Delivery methodology — how AI enrichment becomes a controlled customer engagement |
| [CTI as a Code](https://1200km.com/CTI_as_a_Code/) | Lab framework — structured assignments for applying CTI tradecraft |
| [AI vs Defense](https://1200km.com/ai-vs-defense/) | AI-era threat model — what OpenCTI needs to track as offence evolves |

---

## Author

Andrey Pautov — CTI-to-detection practitioner, Tel Aviv  
[1200km.com](https://1200km.com/) · [Medium](https://medium.com/@1200km) · [LinkedIn](https://www.linkedin.com/in/andrey-pautov/) · [GitHub](https://github.com/anpa1200)

## 1200km Ecosystem

This project is part of the 1200km security research ecosystem. Use [AdversaryGraph](https://1200km.com/adversarygraph/) for CTI-to-detection workflows, ATT&CK/ATLAS mapping, actor relevance, IOC enrichment, and analyst-ready reporting.

- [AdversaryGraph project hub](https://1200km.com/adversarygraph/)
- [AdversaryGraph documentation](https://1200km.com/adversarygraph-docs/)
- [Live ATT&CK/ATLAS workspace](https://1200km.com/threat-matrix/)
- [1200km security research ecosystem](https://1200km.com/)

