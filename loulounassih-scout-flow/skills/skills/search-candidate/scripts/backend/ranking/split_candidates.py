"""
Découpe un JSON regroupant plusieurs candidats en un fichier JSON par personne.
"""
import argparse
import json
import re
from pathlib import Path
import shutil
import os


def _load_candidate_list(input_path: Path) -> list:
    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("candidates", "data", "items"):
            if key in data and isinstance(data[key], list):
                return data[key]
    raise ValueError(
        "Le JSON doit être une liste de candidats, ou un objet contenant une clé "
        "parmi: candidates, data, items."
    )


def _safe_stem(reference: str | None, index: int) -> str:
    if not reference or not str(reference).strip():
        return f"candidate_{index:04d}"
    s = str(reference).strip()
    s = re.sub(r'[<>:"/\\|?*]', "_", s)
    s = s.replace("\n", "_").strip() or f"candidate_{index:04d}"
    return s[:200]


def split_candidates_json(input_path: str | Path, output_dir: str | Path) -> tuple[Path, int]:
    """
    Lit un JSON multi-candidats et crée ``output_dir`` avec un fichier ``.json`` par entrée.

    Les noms de fichiers utilisent ``reference`` quand il est présent, sinon ``candidate_NNNN``.

    Retourne ``(output_dir, nombre_de_fichiers)``.
    """
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    candidates = _load_candidate_list(input_path)
    used_names: set[str] = set()

    for i, item in enumerate(candidates):
        if not isinstance(item, dict):
            item = {"value": item}
        ref = item.get("reference")
        stem = _safe_stem(ref, i)
        filename = f"{stem}.json"
        dup = 1
        while filename in used_names:
            filename = f"{stem}_{dup}.json"
            dup += 1
        used_names.add(filename)

        out_file = output_dir / filename
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(item, f, ensure_ascii=False, indent=2)

    return output_dir, len(candidates)


INPUT = "/Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts/backend/data/candidates.json"
OUTPUT_DIR = "/Users/hackathon-team9/.openclaw/workspace/skills/search-candidate/scripts/backend/ranking/candidates_split"


def main() -> None:
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)

    _, n = split_candidates_json(INPUT, OUTPUT_DIR)


if __name__ == "__main__":
    main()
