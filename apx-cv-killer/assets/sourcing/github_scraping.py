import requests
from dotenv import load_dotenv
import os
# Charger les variables
load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

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
    """Retourne un texte unique utilisable pour gestion de candidature.

    Contenu:
    - informations principales (nom, login, url, bio, etc.)
    - readme de profil utilisateur (si disponible, dans repo username/username)
    - readme des 3 plus gros repos si `hireable`=true, sinon None.
    """

    profile = get_github_user_profile(username, token=token)

    summary_lines = []
    summary_lines.append(f"Nom: {profile.get('name') or 'N/A'}")
    summary_lines.append(f"Login: {profile.get('login')}")
    summary_lines.append(f"URL: {profile.get('html_url')}")
    summary_lines.append(f"Bio: {profile.get('bio') or 'N/A'}")
    summary_lines.append(f"Entreprise: {profile.get('company') or 'N/A'}")
    summary_lines.append(f"Localisation: {profile.get('location') or 'N/A'}")
    summary_lines.append(f"Site Web: {profile.get('blog') or 'N/A'}")
    summary_lines.append(f"Email: {profile.get('email') or 'N/A'}")
    summary_lines.append(f"Hireable: {profile.get('hireable')}")
    summary_lines.append(f"Public repos: {profile.get('public_repos')}")
    summary_lines.append(f"Followers: {profile.get('followers')}, Following: {profile.get('following')}")
    summary_lines.append(f"Créé le: {profile.get('created_at')}")

    summary_lines.append("\n=== README UTILISATEUR ===")
    profile_readme = _get_readme_from_repo(username, username, token=token)
    if profile_readme:
        summary_lines.append(profile_readme)
    else:
        summary_lines.append("Aucun README de profil trouvé (repo de profil non existant ou sans README)")

    if not profile.get("hireable"):
        return None

    summary_lines.append("\n=== README DES 3 PLUS GROS PROJETS ===")

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

    if not top_repos:
        summary_lines.append("Aucun dépôt utilisateur trouvé")
    else:
        for repo in top_repos:
            repo_name = repo.get("name")
            summary_lines.append(f"-- {repo_name} ({repo.get('html_url')}) taille={repo.get('size')}")
            readme = _get_readme_from_repo(username, repo_name, token=token)
            if readme:
                summary_lines.append(readme)
            else:
                summary_lines.append("Aucun README trouvé pour ce dépôt")

    return "\n".join(summary_lines)


if __name__ == "__main__":

    # Exemple d'usage : récupérer exactement 100 profils Python à Paris (si disponibles)
    # mettre votre token ici (ghp_xxx) pour ne pas être bloqué
    users = get_github_profiles_one_page("location:Paris language:Python", token=GITHUB_TOKEN)
    print(f"Trouvé {len(users)} utilisateurs")
    for u in users:
        print(u.get("login"), u.get("html_url"))

    # Exemple d'usage : récupérer un profil utilisateur pour gestion de candidatures
    if users:
        for i in range(20):    
            candidate_login = users[i].get("login")
            profile = get_github_user_profile(candidate_login, token=GITHUB_TOKEN)
            print("Profil candidat:", profile)

            # Exemple d'usage avancé : résumé synthétique utilisable (texte) pour outils RH
            summary = get_github_candidate_summary(candidate_login, token=GITHUB_TOKEN)
            print("\n=== Résumé candidat ===")
            print(summary)
