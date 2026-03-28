import requests
from dotenv import load_dotenv
import os
# Charger les variables
load_dotenv()

GITHUB_TOKEN = ""

def get_github_profiles(query, per_page=100, max_pages=10, token=None):
    """Retourne une liste d'utilisateurs GitHub correspondant à une query de recherche.

    - query : chaîne de recherche GitHub (`location:Paris language:Python` etc.).
    - per_page : nombre de résultats par page (max 100).
    - max_pages : nombre maxi de pages à collecter.
    - token : token GitHub (recommandé pour éviter les limitations de rate limit).
    """

    if per_page <= 0 or per_page > 100:
        raise ValueError("per_page doit être entre 1 et 100")

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    all_users = []
    for page in range(1, max_pages + 1):
        resp = requests.get(
            "https://api.github.com/search/users",
            params={"q": query, "per_page": per_page, "page": page},
            headers=headers,
        )

        resp.raise_for_status()
        data = resp.json()

        items = data.get("items", [])
        if not items:
            break

        all_users.extend(items)

        # GitHub Search API limite à ~1000 résultats
        if len(items) < per_page:
            break

    return all_users


def get_github_profiles_one_page(query, token=None):
    """Retourne jusqu'à 100 profils GitHub dans une seule requête."""
    return get_github_profiles(query, per_page=100, max_pages=1, token=token)


def _get_readme_from_repo(owner, repo, token=None):
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = requests.get(f"https://api.github.com/repos/{owner}/{repo}/readme", headers=headers)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    data = resp.json()
    content = data.get("content")
    if not content:
        return None

    import base64

    try:
        decoded = base64.b64decode(content).decode("utf-8", errors="replace")
    except Exception:
        return None
    return decoded


def get_github_user_profile(username, token=None):
    """Retourne le profil public GitHub d'un utilisateur par son login."""
    if not username:
        raise ValueError("username est requis")

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = requests.get(f"https://api.github.com/users/{username}", headers=headers)
    resp.raise_for_status()
    return resp.json()


def get_github_candidate_summary(username, token=None):
    """Retourne un dictionnaire avec les informations du profil GitHub.

    Contenu:
    - informations principales (nom, login, url, bio, etc.)
    - readme de profil utilisateur
    - readme des 3 plus gros repos si `hireable`=true, sinon None.
    - text: le résumé complet en texte
    """

    profile = get_github_user_profile(username, token=token)

    profile_info = {}
    profile_info['name'] = profile.get('name') or 'N/A'
    profile_info['login'] = profile.get('login')
    profile_info['url'] = profile.get('html_url')
    profile_info['bio'] = profile.get('bio') or 'N/A'
    profile_info['company'] = profile.get('company') or 'N/A'
    profile_info['location'] = profile.get('location') or 'N/A'
    profile_info['blog'] = profile.get('blog') or 'N/A'
    profile_info['email'] = profile.get('email') or 'N/A'
    profile_info['hireable'] = profile.get('hireable')
    profile_info['public_repos'] = profile.get('public_repos')
    profile_info['followers'] = profile.get('followers')
    profile_info['following'] = profile.get('following')
    profile_info['created_at'] = profile.get('created_at')

    profile_readme = _get_readme_from_repo(username, username, token=token)
    profile_info['profile_readme'] = profile_readme or 'Aucun README de profil trouvé'

    if not profile.get("hireable"):
        return None

    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    repo_resp = requests.get(
        f"https://api.github.com/users/{username}/repos",
        params={"sort": "size", "direction": "desc", "per_page": 100},
        headers=headers,
    )
    repo_resp.raise_for_status()
    repos = repo_resp.json() or []
    top_repos = repos[:3]

    profile_info['top_repos'] = []
    for repo in top_repos:
        repo_name = repo.get("name")
        readme = _get_readme_from_repo(username, repo_name, token=token)
        repo_info = {
            'name': repo_name,
            'url': repo.get('html_url'),
            'size': repo.get('size'),
            'readme': readme or 'Aucun README trouvé pour ce dépôt'
        }
        profile_info['top_repos'].append(repo_info)

    # Build the text summary
    summary_lines = []
    summary_lines.append(f"Nom: {profile_info['name']}")
    summary_lines.append(f"Login: {profile_info['login']}")
    summary_lines.append(f"URL: {profile_info['url']}")
    summary_lines.append(f"Bio: {profile_info['bio']}")
    summary_lines.append(f"Entreprise: {profile_info['company']}")
    summary_lines.append(f"Localisation: {profile_info['location']}")
    summary_lines.append(f"Site Web: {profile_info['blog']}")
    summary_lines.append(f"Email: {profile_info['email']}")
    summary_lines.append(f"Hireable: {profile_info['hireable']}")
    summary_lines.append(f"Public repos: {profile_info['public_repos']}")
    summary_lines.append(f"Followers: {profile_info['followers']}, Following: {profile_info['following']}")
    summary_lines.append(f"Créé le: {profile_info['created_at']}")

    summary_lines.append("\n=== README UTILISATEUR ===")
    summary_lines.append(profile_info['profile_readme'])

    summary_lines.append("\n=== README DES 3 PLUS GROS PROJETS ===")

    if not profile_info['top_repos']:
        summary_lines.append("Aucun dépôt utilisateur trouvé")
    else:
        for repo in profile_info['top_repos']:
            summary_lines.append(f"-- {repo['name']} ({repo['url']}) taille={repo['size']}")
            summary_lines.append(repo['readme'])

    profile_info['text'] = "\n".join(summary_lines)

    return profile_info


if __name__ == "__main__":
    import sys
    from pathlib import Path
    BASE_DIR = Path(__file__).resolve().parent.parent
    sys.path.insert(0, str(BASE_DIR))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cv_killer.settings')
    from hrflow_service import HrFlowService

    service = HrFlowService()

    # Récupérer des profils GitHub
    users = get_github_profiles_one_page("location:Paris language:Python", token=GITHUB_TOKEN)
    print(f"Trouvé {len(users)} utilisateurs")

    for user in users[:22]:  # Limiter à 5 pour le test
        login = user.get("login")
        print(f"Traitement de {login}")

        # Obtenir le résumé
        summary = get_github_candidate_summary(login, token=GITHUB_TOKEN)

        if summary and summary.get('hireable'):
            print(f"{login} est hireable")

            # Appliquer parse_profile et envoyer à l'API
            try:
                result = service.parse_profile(login, summary)
                print(f"Profil indexé pour {login}: {result}")
            except Exception as e:
                print(f"Erreur lors de l'indexation de {login}: {e}")
        else:
            print(f"{login} n'est pas hireable ou pas de résumé")
