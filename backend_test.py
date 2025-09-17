import requests
import sys
import json
from datetime import datetime

class TaxCalculationAPITester:
    def __init__(self, base_url="https://realestate-mvp-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.detailed_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_response=None):
        """Run a single API test with optional response validation"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                print(f"✅ Status Code: {response.status_code} - PASSED")
                
                # Additional response validation if provided
                if validate_response and callable(validate_response):
                    validation_result = validate_response(response_data)
                    if validation_result["valid"]:
                        print(f"✅ Response Validation: PASSED - {validation_result['message']}")
                        self.tests_passed += 1
                    else:
                        print(f"❌ Response Validation: FAILED - {validation_result['message']}")
                        success = False
                else:
                    self.tests_passed += 1
            else:
                print(f"❌ Status Code: Expected {expected_status}, got {response.status_code} - FAILED")
                print(f"   Response: {response.text[:500]}")

            self.detailed_results.append({
                "test_name": name,
                "success": success,
                "status_code": response.status_code,
                "response_data": response_data
            })

            return success, response_data

        except Exception as e:
            print(f"❌ Exception: {str(e)} - FAILED")
            self.detailed_results.append({
                "test_name": name,
                "success": False,
                "error": str(e)
            })
            return False, {}

    def validate_case_a_response(self, response_data):
        """Validate Case A: TVA sur marge, MdB eligible"""
        try:
            # Expected calculations for Case A
            # Prix achat: 300,000€, Prix vente: 520,000€, Travaux: 80,000€, Frais agence: 15,000€
            # DMTO MdB: 300,000 * 0.00715 = 2,145€
            # Émoluments notaire (barème 2025): ~3,800€ (approximation)
            # CSI: 300,000 * 0.001 = 300€
            # Débours: 800€
            # TVA sur marge: (520,000 - 395,000) / 1.20 * 0.20 = ~20,833€
            
            dmto = response_data.get('dmto', 0)
            emoluments = response_data.get('emoluments', 0)
            csi = response_data.get('csi', 0)
            debours = response_data.get('debours', 0)
            tva_marge = response_data.get('tva_marge', 0)
            marge_nette = response_data.get('marge_nette', 0)
            tri = response_data.get('tri', 0)
            
            # Validate DMTO MdB rate (0.715%)
            expected_dmto = 300000 * 0.00715
            if abs(dmto - expected_dmto) > 1:  # Allow 1€ tolerance
                return {"valid": False, "message": f"DMTO incorrect: expected ~{expected_dmto:.2f}€, got {dmto:.2f}€"}
            
            # Validate CSI (0.1%)
            expected_csi = 300000 * 0.001
            if abs(csi - expected_csi) > 1:
                return {"valid": False, "message": f"CSI incorrect: expected {expected_csi:.2f}€, got {csi:.2f}€"}
            
            # Validate débours
            if debours != 800:
                return {"valid": False, "message": f"Débours incorrect: expected 800€, got {debours:.2f}€"}
            
            # Validate TVA sur marge exists and is positive
            if tva_marge <= 0:
                return {"valid": False, "message": f"TVA sur marge should be positive, got {tva_marge:.2f}€"}
            
            # Validate marge nette is positive
            if marge_nette <= 0:
                return {"valid": False, "message": f"Marge nette should be positive, got {marge_nette:.2f}€"}
            
            return {"valid": True, "message": f"All calculations valid - DMTO: {dmto:.2f}€, TVA marge: {tva_marge:.2f}€, Marge nette: {marge_nette:.2f}€"}
            
        except Exception as e:
            return {"valid": False, "message": f"Validation error: {str(e)}"}

    def validate_case_b_response(self, response_data):
        """Validate Case B: TVA normale"""
        try:
            dmto = response_data.get('dmto', 0)
            tva_collectee = response_data.get('tva_collectee', 0)
            tva_marge = response_data.get('tva_marge', 0)
            marge_nette = response_data.get('marge_nette', 0)
            
            # Validate DMTO standard rate (4.5%)
            expected_dmto = 240000 * 0.045
            if abs(dmto - expected_dmto) > 1:
                return {"valid": False, "message": f"DMTO incorrect: expected ~{expected_dmto:.2f}€, got {dmto:.2f}€"}
            
            # Validate TVA collectée exists (normal VAT regime)
            if tva_collectee <= 0:
                return {"valid": False, "message": f"TVA collectée should be positive in NORMAL regime, got {tva_collectee:.2f}€"}
            
            # Validate no TVA sur marge in normal regime
            if tva_marge != 0:
                return {"valid": False, "message": f"TVA sur marge should be 0 in NORMAL regime, got {tva_marge:.2f}€"}
            
            return {"valid": True, "message": f"Normal VAT regime calculations valid - DMTO: {dmto:.2f}€, TVA collectée: {tva_collectee:.2f}€"}
            
        except Exception as e:
            return {"valid": False, "message": f"Validation error: {str(e)}"}

    def validate_case_c_response(self, response_data):
        """Validate Case C: Exonération"""
        try:
            dmto = response_data.get('dmto', 0)
            tva_collectee = response_data.get('tva_collectee', 0)
            tva_marge = response_data.get('tva_marge', 0)
            marge_nette = response_data.get('marge_nette', 0)
            
            # Validate DMTO standard rate (4.5%)
            expected_dmto = 250000 * 0.045
            if abs(dmto - expected_dmto) > 1:
                return {"valid": False, "message": f"DMTO incorrect: expected ~{expected_dmto:.2f}€, got {dmto:.2f}€"}
            
            # Validate no VAT in exemption regime
            if tva_collectee != 0:
                return {"valid": False, "message": f"TVA collectée should be 0 in EXO regime, got {tva_collectee:.2f}€"}
            
            if tva_marge != 0:
                return {"valid": False, "message": f"TVA sur marge should be 0 in EXO regime, got {tva_marge:.2f}€"}
            
            return {"valid": True, "message": f"VAT exemption calculations valid - DMTO: {dmto:.2f}€, No VAT"}
            
        except Exception as e:
            return {"valid": False, "message": f"Validation error: {str(e)}"}

    def test_api_health(self):
        """Test API health endpoint"""
        return self.run_test(
            "API Health Check",
            "GET",
            "",
            200
        )

    def test_case_a_tva_marge_mdb(self):
        """Test Case A: TVA sur marge, MdB eligible"""
        data = {
            "dept": "75",
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 520000,
            "travaux_ttc": 80000,
            "frais_agence_ttc": 15000,
            "hypotheses": {
                "md_b_0715_ok": True
            }
        }
        
        return self.run_test(
            "Case A - TVA sur marge + MdB eligible",
            "POST",
            "estimate/run",
            200,
            data=data,
            validate_response=self.validate_case_a_response
        )

    def test_case_b_tva_normale(self):
        """Test Case B: TVA normale"""
        data = {
            "dept": "92",
            "regime_tva": "NORMAL",
            "prix_achat_ttc": 240000,
            "prix_vente_ttc": 360000,
            "travaux_ttc": 0,
            "frais_agence_ttc": 0,
            "hypotheses": {
                "md_b_0715_ok": False
            }
        }
        
        return self.run_test(
            "Case B - TVA normale",
            "POST",
            "estimate/run",
            200,
            data=data,
            validate_response=self.validate_case_b_response
        )

    def test_case_c_exoneration(self):
        """Test Case C: Exonération"""
        data = {
            "dept": "69",
            "regime_tva": "EXO",
            "prix_achat_ttc": 250000,
            "prix_vente_ttc": 310000,
            "travaux_ttc": 0,
            "frais_agence_ttc": 0,
            "hypotheses": {
                "md_b_0715_ok": False
            }
        }
        
        return self.run_test(
            "Case C - Exonération TVA",
            "POST",
            "estimate/run",
            200,
            data=data,
            validate_response=self.validate_case_c_response
        )

    def test_projects_endpoints(self):
        """Test projects CRUD endpoints"""
        # Test GET projects
        success_get, _ = self.run_test(
            "Get Projects List",
            "GET",
            "projects",
            200
        )
        
        # Test POST project creation
        project_data = {
            "label": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "address": {"street": "123 Test St", "city": "Paris"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 400000
        }
        
        success_post, response = self.run_test(
            "Create New Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        return success_get and success_post

    def print_summary(self):
        """Print test summary"""
        print(f"\n" + "="*60)
        print(f"📊 TEST SUMMARY")
        print(f"="*60)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [r for r in self.detailed_results if not r["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test_name']}")
                if 'error' in test:
                    print(f"     Error: {test['error']}")
                elif 'status_code' in test:
                    print(f"     Status: {test['status_code']}")
        
        # Show successful tests
        successful_tests = [r for r in self.detailed_results if r["success"]]
        if successful_tests:
            print(f"\n✅ SUCCESSFUL TESTS ({len(successful_tests)}):")
            for test in successful_tests:
                print(f"   • {test['test_name']}")

def main():
    print("🏢 Starting Tax Calculation API Tests")
    print("="*60)
    
    tester = TaxCalculationAPITester()
    
    # Run all tests
    print("\n1. Testing API Health...")
    tester.test_api_health()
    
    print("\n2. Testing Core Business Cases...")
    tester.test_case_a_tva_marge_mdb()
    tester.test_case_b_tva_normale()
    tester.test_case_c_exoneration()
    
    print("\n3. Testing Projects Endpoints...")
    tester.test_projects_endpoints()
    
    # Print summary
    tester.print_summary()
    
    # Return exit code
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())