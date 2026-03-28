import os
import json
import paramiko
from dotenv import load_dotenv

# Charger les variables
load_dotenv()

SSH_HOST = "192.168.0.25"
SSH_USER = "hackathon-team2"
SSH_PASS = os.getenv("SSH_PASSWORD")
TOKEN = os.getenv("OPENCLAW_GATEWAY_TOKEN")

def ask_openclaw_direct(prompt):
    # 1. Initialisation du client SSH
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        # 2. Connexion automatisée : on force le mdp et on interdit les clés publiques !
        client.connect(
            SSH_HOST, 
            username=SSH_USER, 
            password=SSH_PASS, 
            look_for_keys=False, # Règle le problème du PubkeyAuthentication=no
            allow_agent=False
        )
        
        # 3. Préparation des données JSON
        payload_str = json.dumps({
            "model": "openclaw:main",
            "messages": [{"role": "user", "content": prompt}]
        })
        
        # 4. On demande au Mac Mini de faire le curl lui-même (via stdin pour éviter les soucis de guillemets)
        curl_cmd = f'curl -s -X POST "http://127.0.0.1:18789/v1/chat/completions" ' \
                   f'-H "Content-Type: application/json" ' \
                   f'-H "Authorization: Bearer {TOKEN}" ' \
                   f'-d @-'
                   
        stdin, stdout, stderr = client.exec_command(curl_cmd)
        
        # On envoie le JSON et on ferme l'entrée
        stdin.write(payload_str)
        stdin.channel.shutdown_write()
        
        # 5. Récupération et parsing de la réponse
        raw_output = stdout.read().decode('utf-8')
        
        if not raw_output:
            error_msg = stderr.read().decode('utf-8')
            return f"Erreur cURL distante : {error_msg}"
            
        response_json = json.loads(raw_output)
        return response_json['choices'][0]['message']['content']
        
    except paramiko.AuthenticationException:
        return "❌ Erreur : Mot de passe incorrect ou refusé."
    except Exception as e:
        return f"❌ Erreur inattendue : {e}"
    finally:
        client.close()

# --- MAIN ---
if __name__ == "__main__":
    print("🔌 Connexion SSH en cours d'arrière-plan...")
    question = "Peux-tu me confirmer que cette exécution distante 100% automatisée fonctionne ?"
    
    print("⏳ Envoi de la requête à OpenClaw...")
    reponse = ask_openclaw_direct(question)
    
    print(f"\n🤖 Réponse d'OpenClaw :\n{reponse}")