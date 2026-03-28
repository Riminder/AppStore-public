import sqlite3
import json
from datetime import datetime

DB_NAME = "sourcing.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            search_id INTEGER,
            name TEXT,
            headline TEXT,
            location TEXT,
            profile_url TEXT,
            source_platform TEXT,
            hrflow_profile_key TEXT,
            score REAL,
            rank INTEGER,
            raw_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(search_id) REFERENCES searches(id)
        )
    ''')
    conn.commit()
    conn.close()

def save_search(query: str) -> int:
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO searches (query) VALUES (?)", (query,))
    search_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return search_id

def save_candidate(search_id: int, candidate: dict):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO candidates (search_id, name, headline, location, profile_url, 
                               source_platform, hrflow_profile_key, score, rank, raw_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        search_id, candidate['name'], candidate.get('headline'), candidate.get('location'),
        candidate['profile_url'], candidate.get('source_platform', 'github'),
        candidate.get('hrflow_profile_key'), candidate.get('score', 0),
        candidate.get('rank'), json.dumps(candidate)
    ))
    conn.commit()
    conn.close()

def get_recent_searches(limit=20):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT s.*, (SELECT COUNT(*) FROM candidates WHERE search_id = s.id) as candidate_count 
        FROM searches s ORDER BY created_at DESC LIMIT ?
    ''', (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

init_db()