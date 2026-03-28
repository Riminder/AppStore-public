import requests

FASTAPI_URL   = "http://localhost:8001"
GATEWAY_URL   = "http://localhost:18789"
GATEWAY_TOKEN = "ea28e9b03545f00a79e3d3c857e18fb0df7e83dc8f211b75"


def health_check():
    status = {}
    try:
        requests.get(f"{FASTAPI_URL}/health", timeout=2)
        status["fastapi"] = True
    except:
        status["fastapi"] = False
    try:
        requests.get(GATEWAY_URL, timeout=2)
        status["openclaw"] = True
    except:
        status["openclaw"] = False
    return status


def parse_and_score(file_bytes, filename, location="Paris"):
    try:
        resp = requests.post(
            f"{FASTAPI_URL}/full-pipeline",
            files={"file": (filename, file_bytes, "application/pdf")},
            params={"location": location},
            timeout=180
        )
        return resp.json()
    except Exception as e:
        return {"error": str(e), "profile": {}, "results": []}
