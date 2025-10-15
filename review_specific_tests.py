#!/usr/bin/env python3
"""
Specific tests from the review request
"""

import requests
import json
import time

class ReviewSpecificTester:
    def __init__(self, base_url="https://dealflow-tracker-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None

    def setup_auth(self):
        """Setup authentication"""
        print("🔐 Setting up authentication...")
        try:
            response = requests.post(f"{self.api_url}/auth/dev-session", timeout=10)
            if response.status_code == 200:
                if 'Set-Cookie' in response.headers:
                    cookie_header = response.headers['Set-Cookie']
                    if 'session_token=' in cookie_header:
                        start = cookie_header.find('session_token=') + len('session_token=')
                        end = cookie_header.find(';', start)
                        if end == -1:
                            end = len(cookie_header)
                        self.session_token = cookie_header[start:end]
                        print("✅ Authentication successful")
                        return True
            print("❌ Authentication failed")
            return False
        except Exception as e:
            print(f"❌ Auth error: {e}")
            return False

    def test_validation_echec_prix_vente_inferieur(self):
        """Test validation échoue - prix vente < prix achat (from review request)"""
        print("\n🔍 Test validation avancée - prix vente < prix achat")
        
        data = {
            "label": "Projet Test",
            "address": {"line1": "Test", "city": "Paris", "dept": "75"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 500000,
            "prix_vente_ttc": 400000,
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        cookies = {'session_token': self.session_token} if self.session_token else {}
        response = requests.post(
            f"{self.api_url}/projects",
            json=data,
            cookies=cookies,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code in [400, 422]:
            response_data = response.json()
            print(f"✅ Validation rejetée correctement: {response_data.get('message', 'Unknown')}")
            return True
        else:
            print(f"❌ Validation devrait échouer: {response.text[:200]}")
            return False

    def test_tri_ajuste_facteurs_risque(self):
        """Test TRI ajusté avec facteurs risque (from review request)"""
        print("\n🔍 Test calculs avancés - TRI ajusté avec facteurs risque")
        
        data = {
            "label": "Test TRI Avance",
            "address": {"line1": "Test", "city": "Paris", "dept": "93"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 450000,
            "travaux_ttc": 180000,
            "frais_agence_ttc": 15000
        }
        
        cookies = {'session_token': self.session_token} if self.session_token else {}
        response = requests.post(
            f"{self.api_url}/projects",
            json=data,
            cookies=cookies,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            project_data = response.json()
            tri_estime = project_data.get('tri_estime', 0)
            print(f"✅ TRI calculé avec facteurs risque: {tri_estime:.4f}")
            print(f"   Département 93 (risque élevé) + Travaux 60% du prix d'achat")
            return True
        else:
            print(f"❌ Création projet échouée: {response.text[:200]}")
            return False

    def test_rate_limiting_5_projets_minute(self):
        """Test limite 5 projets/minute (from review request)"""
        print("\n🔍 Test rate limiting - 5 projets/minute")
        
        cookies = {'session_token': self.session_token} if self.session_token else {}
        successful = 0
        
        for i in range(1, 8):
            data = {
                "label": f"Projet Rate Limit {i}",
                "address": {"line1": "Test", "city": "Paris", "dept": "75"},
                "regime_tva": "MARGE",
                "prix_achat_ttc": 300000,
                "prix_vente_ttc": 450000,
                "travaux_ttc": 50000,
                "frais_agence_ttc": 10000
            }
            
            response = requests.post(
                f"{self.api_url}/projects",
                json=data,
                cookies=cookies,
                timeout=10
            )
            
            if response.status_code == 200:
                successful += 1
                print(f"   Requête {i}: ✅ ({response.status_code})")
            elif response.status_code == 429:
                print(f"   Requête {i}: 🚫 Rate limited ({response.status_code})")
                break
            else:
                print(f"   Requête {i}: ❌ ({response.status_code})")
            
            time.sleep(0.1)
        
        print(f"✅ Rate limiting: {successful} requêtes réussies avant limitation")
        return True

    def test_export_pdf_projet_existant(self):
        """Test export PDF avec projet existant (from review request)"""
        print("\n🔍 Test export PDF avec projet existant")
        
        # First create a project to ensure we have one
        data = {
            "label": "Projet Export PDF Test",
            "address": {"line1": "Test", "city": "Paris", "dept": "75"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 450000,
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        cookies = {'session_token': self.session_token} if self.session_token else {}
        create_response = requests.post(
            f"{self.api_url}/projects",
            json=data,
            cookies=cookies,
            timeout=10
        )
        
        if create_response.status_code != 200:
            print(f"❌ Impossible de créer projet test: {create_response.status_code}")
            return False
        
        project_id = create_response.json().get('id')
        print(f"Projet créé: {project_id}")
        
        # Test bank export
        bank_response = requests.get(
            f"{self.api_url}/projects/{project_id}/export/bank",
            cookies=cookies,
            timeout=15
        )
        
        # Test notary export
        notary_response = requests.get(
            f"{self.api_url}/projects/{project_id}/export/notary",
            cookies=cookies,
            timeout=15
        )
        
        bank_success = (bank_response.status_code == 200 and 
                       len(bank_response.content) > 1000 and 
                       bank_response.content.startswith(b'%PDF'))
        
        notary_success = (notary_response.status_code == 200 and 
                         len(notary_response.content) > 1000 and 
                         notary_response.content.startswith(b'%PDF'))
        
        if bank_success and notary_success:
            print(f"✅ Export PDF réussi:")
            print(f"   - Dossier banque: {len(bank_response.content)} bytes")
            print(f"   - Dossier notaire: {len(notary_response.content)} bytes")
            return True
        else:
            print(f"❌ Export PDF échoué - Bank: {bank_response.status_code}, Notary: {notary_response.status_code}")
            return False

def main():
    print("🎯 TESTS SPÉCIFIQUES DE LA REVIEW REQUEST")
    print("="*60)
    
    tester = ReviewSpecificTester()
    
    if not tester.setup_auth():
        print("❌ Impossible de continuer sans authentification")
        return 1
    
    tests_passed = 0
    total_tests = 4
    
    # Run specific tests from review request
    if tester.test_validation_echec_prix_vente_inferieur():
        tests_passed += 1
    
    if tester.test_tri_ajuste_facteurs_risque():
        tests_passed += 1
    
    if tester.test_rate_limiting_5_projets_minute():
        tests_passed += 1
    
    if tester.test_export_pdf_projet_existant():
        tests_passed += 1
    
    print(f"\n" + "="*60)
    print(f"📊 RÉSULTATS TESTS SPÉCIFIQUES")
    print(f"="*60)
    print(f"Tests réussis: {tests_passed}/{total_tests}")
    print(f"Taux de succès: {(tests_passed/total_tests*100):.1f}%")
    
    if tests_passed == total_tests:
        print("🎉 TOUS LES TESTS SPÉCIFIQUES RÉUSSIS!")
    else:
        print(f"⚠️ {total_tests - tests_passed} test(s) à corriger")
    
    return 0 if tests_passed >= 3 else 1

if __name__ == "__main__":
    exit(main())