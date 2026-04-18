"""
CSV parser utility.
Accepts a raw CSV bytes payload and a column mapping dict, then returns
a list of lead dicts ready for the scoring + DB insertion pipeline.
"""

import csv
import io
import json
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Canonical field names for the lead schema
LEAD_FIELDS = [
    "company_name",
    "website",
    "industry",
    "niche",
    "ad_spend_signal",
    "contact_name",
    "contact_title",
    "contact_email",
    "contact_linkedin",
    "contact_phone",
    "role_bucket",
    "pain_signals",
    "hiring_triggers",
    "verified_email",
    "notes",
]

REQUIRED_FIELDS = {"company_name"}
CONTACT_REQUIRED = {"contact_email", "contact_linkedin"}  # at least one


def parse_csv_bytes(
    content: bytes,
    column_mapping: dict[str, str] | None = None,
) -> tuple[list[dict[str, Any]], list[str]]:
    """
    Parse a CSV file from raw bytes.

    :param content: Raw CSV bytes.
    :param column_mapping: Maps CSV column headers → lead field names.
                           If None, assumes headers match lead field names exactly.
    :returns: (leads, errors) where errors is a list of row-level warning strings.
    """
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        return [], ["CSV file appears to be empty or has no headers"]

    leads: list[dict[str, Any]] = []
    errors: list[str] = []

    for row_num, row in enumerate(reader, start=2):  # row 1 = header
        mapped = _map_row(row, column_mapping)

        row_errors = _validate_row(mapped, row_num)
        if row_errors:
            errors.extend(row_errors)
            continue  # skip invalid rows

        cleaned = _clean_row(mapped)
        leads.append(cleaned)

    return leads, errors


def _map_row(row: dict, mapping: dict[str, str] | None) -> dict:
    if mapping is None:
        return dict(row)
    return {mapping.get(k, k): v for k, v in row.items()}


def _validate_row(row: dict, row_num: int) -> list[str]:
    errs = []
    if not row.get("company_name", "").strip():
        errs.append(f"Row {row_num}: missing company_name")
        return errs  # can't identify the row without company name
    if not row.get("contact_email", "").strip() and not row.get("contact_linkedin", "").strip():
        errs.append(
            f"Row {row_num} ({row['company_name']}): "
            "requires at least contact_email or contact_linkedin"
        )
    return errs


def _clean_row(row: dict) -> dict:
    """Normalise types and strip unknown keys."""
    cleaned: dict[str, Any] = {}
    for field in LEAD_FIELDS:
        val = row.get(field, "")
        if isinstance(val, str):
            val = val.strip() or None
        # JSON fields
        if field in ("pain_signals", "hiring_triggers"):
            if isinstance(val, str):
                try:
                    val = json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    val = []
            elif val is None:
                val = []
        # Boolean
        if field == "verified_email":
            cleaned[field] = str(val).lower() in ("true", "1", "yes") if val else False
        else:
            cleaned[field] = val
    return cleaned
