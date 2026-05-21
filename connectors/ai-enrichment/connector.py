import os
import json
import time
import anthropic
from pycti import OpenCTIConnectorHelper

SYSTEM_PROMPT = """You are a senior cyber threat intelligence analyst.
Analyze threat intelligence content and return structured JSON only.
No prose, no markdown fences, no explanation — raw JSON."""

REPORT_PROMPT = """Analyze this threat intelligence report. Return JSON with exactly these keys:
- summary: string (2-3 sentence executive brief, plain text)
- threat_actors: list of strings (actor names, aliases, groups mentioned)
- malware_families: list of strings (malware/tool names)
- attack_techniques: list of strings (MITRE ATT&CK IDs only, e.g. ["T1059.001", "T1003"])
- targeted_sectors: list of strings (e.g. ["Finance", "Healthcare", "Government"])
- targeted_countries: list of strings (ISO 3166-1 alpha-2, e.g. ["US", "UA", "DE"])
- confidence: integer 0-100

Report:
{content}"""

INTRUSION_SET_PROMPT = """Analyze this threat actor / intrusion set profile. Return JSON with exactly these keys:
- summary: string (2-3 sentence executive brief)
- aliases: list of strings (other known names)
- malware_families: list of strings (malware/tools this actor uses)
- attack_techniques: list of strings (MITRE ATT&CK IDs, e.g. ["T1059.001", "T1003"])
- targeted_sectors: list of strings (sectors this actor targets)
- targeted_countries: list of strings (ISO 3166-1 alpha-2 codes)
- motivation: string (one of: "espionage", "financial", "hacktivism", "destruction", "unknown")
- sophistication: string (one of: "minimal", "intermediate", "advanced", "expert", "unknown")
- confidence: integer 0-100

Profile:
{content}"""


class AIEnrichmentConnector:
    def __init__(self):
        config = {
            "opencti": {
                "url": os.environ.get("OPENCTI_URL", "http://opencti:8080"),
                "token": os.environ["OPENCTI_TOKEN"],
            },
            "connector": {
                "id": os.environ["CONNECTOR_ID"],
                "type": "INTERNAL_ENRICHMENT",
                "name": os.environ.get("CONNECTOR_NAME", "AI Enrichment (Claude)"),
                "scope": "Report,Intrusion-Set,Threat-Actor-Group,Malware",
                "log_level": os.environ.get("CONNECTOR_LOG_LEVEL", "info"),
                "auto": False,
            },
        }
        self.helper = OpenCTIConnectorHelper(config)
        self.client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
        self.model = os.environ.get("AI_MODEL", "claude-opus-4-7")

    # -------------------------------------------------------------------------
    # Claude call with retry on rate limit
    # -------------------------------------------------------------------------

    def _call_claude(self, prompt_template: str, content: str) -> dict | None:
        for attempt in range(3):
            try:
                msg = self.client.messages.create(
                    model=self.model,
                    max_tokens=2048,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": prompt_template.format(content=content[:8000])}],
                )
                return json.loads(msg.content[0].text)
            except anthropic.RateLimitError:
                wait = 60 * (attempt + 1)
                self.helper.log_warning(f"Rate limited — waiting {wait}s")
                time.sleep(wait)
            except (json.JSONDecodeError, anthropic.APIError) as e:
                self.helper.log_error(f"Claude call failed: {e}")
                return None
        return None

    # -------------------------------------------------------------------------
    # STIX write-back helpers
    # -------------------------------------------------------------------------

    def _add_note(self, entity_id: str, summary: str, confidence: int) -> None:
        self.helper.api.note.create(
            abstract="AI Summary",
            content=summary,
            confidence=confidence,
            object_ids=[entity_id],
        )

    def _link_threat_actors(self, entity_id: str, names: list, confidence: int) -> None:
        for name in names:
            actor = self.helper.api.threat_actor_group.read(
                filters={"mode": "and", "filters": [{"key": "name", "values": [name]}], "filterGroups": []}
            )
            if actor:
                self.helper.api.stix_core_relationship.create(
                    fromId=entity_id,
                    toId=actor["id"],
                    relationship_type="related-to",
                    confidence=confidence,
                )

    def _link_malware(self, entity_id: str, names: list, confidence: int) -> None:
        for name in names:
            malware = self.helper.api.malware.read(
                filters={"mode": "and", "filters": [{"key": "name", "values": [name]}], "filterGroups": []}
            )
            if malware:
                self.helper.api.stix_core_relationship.create(
                    fromId=entity_id,
                    toId=malware["id"],
                    relationship_type="uses",
                    confidence=confidence,
                )

    def _link_attack_patterns(self, entity_id: str, technique_ids: list, confidence: int) -> None:
        for tid in technique_ids:
            pattern = self.helper.api.attack_pattern.read(
                filters={"mode": "and", "filters": [{"key": "x_mitre_id", "values": [tid]}], "filterGroups": []}
            )
            if not pattern:
                pattern = self.helper.api.attack_pattern.create(
                    name=tid,
                    x_mitre_id=tid,
                    confidence=50,
                )
            if pattern:
                self.helper.api.stix_core_relationship.create(
                    fromId=entity_id,
                    toId=pattern["id"],
                    relationship_type="uses",
                    confidence=confidence,
                )

    def _update_score(self, entity_id: str, confidence: int) -> None:
        self.helper.api.stix_domain_object.update_field(
            id=entity_id,
            input={"key": "x_opencti_score", "value": str(confidence)},
        )

    # -------------------------------------------------------------------------
    # Enrichment handlers per entity type
    # -------------------------------------------------------------------------

    def _enrich_report(self, report: dict) -> str:
        content = report.get("description") or ""
        if len(content) < 50:
            content = report.get("name", "")
        if not content or len(content) < 10:
            return "Skipped: content too short"

        self.helper.log_info(f"Enriching report: {report['name']}")
        result = self._call_claude(REPORT_PROMPT, content)
        if not result:
            return "Skipped: Claude error"

        confidence = result.get("confidence", 50)
        entity_id = report["id"]

        if result.get("summary"):
            self._add_note(entity_id, result["summary"], confidence)
        if result.get("threat_actors"):
            self._link_threat_actors(entity_id, result["threat_actors"], confidence)
        if result.get("malware_families"):
            self._link_malware(entity_id, result["malware_families"], confidence)
        if result.get("attack_techniques"):
            self._link_attack_patterns(entity_id, result["attack_techniques"], confidence)

        self._update_score(entity_id, confidence)
        self.helper.log_info(f"Enriched report '{report['name']}'")
        return "Enriched"

    def _enrich_intrusion_set(self, entity: dict) -> str:
        content = entity.get("description") or entity.get("name", "")
        if not content or len(content) < 10:
            return "Skipped: content too short"

        self.helper.log_info(f"Enriching intrusion set: {entity['name']}")
        result = self._call_claude(INTRUSION_SET_PROMPT, content)
        if not result:
            return "Skipped: Claude error"

        confidence = result.get("confidence", 50)
        entity_id = entity["id"]

        if result.get("summary"):
            self._add_note(entity_id, result["summary"], confidence)
        if result.get("malware_families"):
            self._link_malware(entity_id, result["malware_families"], confidence)
        if result.get("attack_techniques"):
            self._link_attack_patterns(entity_id, result["attack_techniques"], confidence)

        self.helper.log_info(f"Enriched intrusion set '{entity['name']}'")
        return "Enriched"

    # -------------------------------------------------------------------------
    # Event handler
    # -------------------------------------------------------------------------

    def process_message(self, data: dict) -> str:
        entity_type = data.get("entity_type", "").lower()
        entity_id = data.get("entity_id")
        enrichment_entity = data.get("enrichment_entity", {})

        self.helper.log_info(f"Received entity_type='{entity_type}' id='{entity_id}'")

        if not entity_id:
            return "Skipped"

        entity = enrichment_entity or {}

        if entity_type == "report":
            if not entity:
                entity = self.helper.api.report.read(id=entity_id) or {}
            if entity.get("confidence", 0) < 40:
                return "Skipped: low confidence"
            return self._enrich_report(entity)

        if entity_type in ("intrusion-set", "threat-actor-group"):
            if not entity:
                entity = self.helper.api.intrusion_set.read(id=entity_id) or {}
            if not entity:
                return "Not found"
            return self._enrich_intrusion_set(entity)

        if entity_type == "malware":
            if not entity:
                entity = self.helper.api.malware.read(id=entity_id) or {}
            if not entity:
                return "Not found"
            content = entity.get("description") or entity.get("name", "")
            if not content or len(content) < 10:
                return "Skipped: content too short"
            self.helper.log_info(f"Enriching malware: {entity['name']}")
            result = self._call_claude(REPORT_PROMPT, content)
            if not result:
                return "Skipped: Claude error"
            confidence = result.get("confidence", 50)
            if result.get("summary"):
                self._add_note(entity["id"], result["summary"], confidence)
            if result.get("attack_techniques"):
                self._link_attack_patterns(entity["id"], result["attack_techniques"], confidence)
            self._update_score(entity["id"], confidence)
            return "Enriched"

        return "Skipped"

    def start(self):
        self.helper.log_info("AI Enrichment connector starting...")
        self.helper.listen(self.process_message)


if __name__ == "__main__":
    AIEnrichmentConnector().start()
