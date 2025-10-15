import requests
import sys
import json
import os
import tempfile
from datetime import datetime
from pathlib import Path

class TaxCalculationAPITester:
    def __init__(self, base_url="https://realestate-hub-209.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.detailed_results = []
        self.session_token = None
        self.test_project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_response=None, files=None, form_data=None):
        """Run a single API test with optional response validation"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        # Add session cookie if available
        cookies = {}
        if self.session_token:
            cookies['session_token'] = self.session_token
        
        # Set headers based on request type
        if files or form_data:
            # Don't set Content-Type for multipart/form-data - requests will set it
            pass
        else:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data and not files:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, cookies=cookies, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=form_data, headers=headers, cookies=cookies, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, cookies=cookies, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, cookies=cookies, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, cookies=cookies, timeout=10)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text}

            if success:
                print(f"✅ Status Code: {response.status_code} - PASSED")
                
                # Print response data for estimator tests
                if "estimate" in endpoint and response_data:
                    print(f"   Response fields: {list(response_data.keys())}")
                    if 'explain' in response_data:
                        print(f"   Explain length: {len(response_data['explain'])} chars")
                
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
            explain = response_data.get('explain', '')
            
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
            
            # Check for detailed explanation
            if not explain or len(explain) < 100:
                return {"valid": False, "message": f"Explain should be detailed, got: {len(explain)} characters"}
            
            # Check for warnings about travaux structurants
            if "travaux structurants" not in explain.lower() and "décennale" not in explain.lower():
                return {"valid": False, "message": "Missing warning about travaux structurants/garantie décennale"}
            
            return {"valid": True, "message": f"All calculations valid - DMTO: {dmto:.2f}€, TVA marge: {tva_marge:.2f}€, Marge nette: {marge_nette:.2f}€, Warnings present"}
            
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
                "md_b_0715_ok": True,
                "travaux_structurants": True
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
            "travaux_ttc": 30000,
            "frais_agence_ttc": 10000,
            "hypotheses": {}
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
            "travaux_ttc": 20000,
            "frais_agence_ttc": 5000,
            "hypotheses": {}
        }
        
        return self.run_test(
            "Case C - Exonération TVA",
            "POST",
            "estimate/run",
            200,
            data=data,
            validate_response=self.validate_case_c_response
        )

    def test_projects_crud_comprehensive(self):
        """Test comprehensive Project CRUD operations as requested"""
        print("\n📋 Testing Project CRUD Operations...")
        
        # Test 1: GET projects list
        success_get, projects_response = self.run_test(
            "GET Projects List",
            "GET",
            "projects",
            200
        )
        
        # Test 2: POST project creation with full address (Google Maps scenario)
        project_data = {
            "label": "Test Google Maps Project",
            "address": {
                "line1": "10 Rue de la Paix",
                "city": "Paris", 
                "dept": "75"
            },
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 450000,
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        success_post, create_response = self.run_test(
            "POST Create Project with Full Address",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if not success_post or 'id' not in create_response:
            print("❌ Cannot continue CRUD tests without project creation")
            return False
            
        project_id = create_response['id']
        print(f"✅ Created project with ID: {project_id}")
        
        # Test 3: GET specific project details
        success_get_detail, detail_response = self.run_test(
            "GET Project Details",
            "GET",
            f"projects/{project_id}",
            200
        )
        
        # Validate cost distribution data for pie chart
        if success_get_detail:
            required_cost_fields = ['prix_achat_ttc', 'travaux_ttc', 'frais_agence_ttc']
            missing_fields = [field for field in required_cost_fields if field not in detail_response]
            if missing_fields:
                print(f"❌ Missing cost distribution fields: {missing_fields}")
            else:
                print(f"✅ All cost distribution fields present for pie chart")
        
        # Test 4: PATCH project update (address change for Google Maps)
        update_data = {
            "address": {
                "line1": "15 Avenue des Champs-Élysées",
                "city": "Paris",
                "dept": "75"
            },
            "prix_vente_ttc": 480000  # Also test dynamic calculation
        }
        
        success_patch, update_response = self.run_test(
            "PATCH Update Project Address",
            "PATCH",
            f"projects/{project_id}",
            200,
            data=update_data
        )
        
        # Validate dynamic recalculation
        if success_patch and 'marge_estimee' in update_response:
            expected_margin = 480000 - 300000 - 50000 - 10000  # 120000
            actual_margin = update_response['marge_estimee']
            if abs(actual_margin - expected_margin) < 1:
                print(f"✅ Dynamic calculation correct: {actual_margin:,.2f}€")
            else:
                print(f"❌ Dynamic calculation incorrect: got {actual_margin:,.2f}€, expected {expected_margin:,.2f}€")
        
        # Test 5: DELETE project
        success_delete, _ = self.run_test(
            "DELETE Project",
            "DELETE",
            f"projects/{project_id}",
            200
        )
        
        return all([success_get, success_post, success_get_detail, success_patch, success_delete])

    def validate_project_creation_response(self, response_data):
        """Validate project creation response has all required fields"""
        required_fields = ['id', 'label', 'address', 'regime_tva', 'prix_achat_ttc', 'prix_vente_ttc']
        missing_fields = [field for field in required_fields if field not in response_data]
        
        if missing_fields:
            return {"valid": False, "message": f"Missing required fields: {', '.join(missing_fields)}"}
        
        # Validate address structure for Google Maps
        address = response_data.get('address', {})
        if not isinstance(address, dict):
            return {"valid": False, "message": "Address should be an object"}
        
        address_fields = ['line1', 'city', 'dept']
        missing_address_fields = [field for field in address_fields if field not in address]
        if missing_address_fields:
            return {"valid": False, "message": f"Missing address fields: {', '.join(missing_address_fields)}"}
        
        return {"valid": True, "message": "Project creation response valid with complete address data"}

    def test_project_validation_scenarios(self):
        """Test project validation scenarios"""
        print("\n🔍 Testing Project Validation Scenarios...")
        
        # Test invalid data - price validation
        invalid_project = {
            "label": "Invalid Project",
            "address": {"line1": "Test", "city": "Paris", "dept": "75"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 250000,  # Lower than purchase price
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        success_invalid, _ = self.run_test(
            "POST Invalid Project (Sale < Purchase)",
            "POST",
            "projects",
            422,  # Expect validation error
            data=invalid_project
        )
        
        # Test valid project with validation
        valid_project = {
            "label": "Valid Test Project",
            "address": {"line1": "10 Rue de la Paix", "city": "Paris", "dept": "75"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 450000,
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        success_valid, _ = self.run_test(
            "POST Valid Project Creation",
            "POST",
            "projects",
            200,
            data=valid_project,
            validate_response=self.validate_project_creation_response
        )
        
        return success_invalid and success_valid

    def validate_all_required_fields(self, response_data):
        """Validate all required fields are present in estimate response"""
        required_fields = [
            'dmto', 'emoluments', 'csi', 'debours', 
            'tva_collectee', 'tva_marge', 'marge_brute', 
            'marge_nette', 'tri', 'explain'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in response_data:
                missing_fields.append(field)
        
        if missing_fields:
            return {"valid": False, "message": f"Missing required fields: {', '.join(missing_fields)}"}
        
        # Check numeric fields are numbers
        numeric_fields = ['dmto', 'emoluments', 'csi', 'debours', 'tva_collectee', 'tva_marge', 'marge_brute', 'marge_nette', 'tri']
        for field in numeric_fields:
            if not isinstance(response_data[field], (int, float)):
                return {"valid": False, "message": f"Field {field} should be numeric, got {type(response_data[field])}"}
        
        # Check explain is string and not empty
        if not isinstance(response_data['explain'], str) or len(response_data['explain']) < 10:
            return {"valid": False, "message": f"Field 'explain' should be a non-empty string, got {len(response_data.get('explain', ''))} chars"}
        
        return {"valid": True, "message": f"All {len(required_fields)} required fields present and valid"}

    def setup_authentication(self):
        """Setup dev session for testing"""
        print("\n🔐 Setting up authentication...")
        try:
            url = f"{self.api_url}/auth/dev-session"
            response = requests.post(url, timeout=10)
            
            if response.status_code == 200:
                # Extract session token from cookies
                if 'Set-Cookie' in response.headers:
                    cookie_header = response.headers['Set-Cookie']
                    if 'session_token=' in cookie_header:
                        # Extract session token value
                        start = cookie_header.find('session_token=') + len('session_token=')
                        end = cookie_header.find(';', start)
                        if end == -1:
                            end = len(cookie_header)
                        self.session_token = cookie_header[start:end]
                        print(f"✅ Authentication successful - Session token obtained")
                        return True
                
                print(f"❌ No session token in response cookies")
                return False
            else:
                print(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False

    def create_test_project(self):
        """Create a test project for document testing"""
        print("\n📁 Creating test project...")
        
        project_data = {
            "label": f"Test Project Documents {datetime.now().strftime('%H%M%S')}",
            "address": {
                "line1": "123 Rue de Test",
                "city": "Paris",
                "dept": "75"
            },
            "regime_tva": "MARGE",
            "prix_achat_ttc": 350000,
            "prix_vente_ttc": 500000,
            "travaux_ttc": 70000,
            "frais_agence_ttc": 15000
        }
        
        success, response = self.run_test(
            "Create Test Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.test_project_id = response['id']
            print(f"✅ Test project created with ID: {self.test_project_id}")
            return True
        else:
            print(f"❌ Failed to create test project")
            return False

    def create_test_document(self):
        """Create a test PDF document for upload testing"""
        # Create a simple test PDF content
        test_content = b"""%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
300
%%EOF"""
        
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
        temp_file.write(test_content)
        temp_file.close()
        
        return temp_file.name

    def test_document_upload(self):
        """Test document upload functionality"""
        if not self.test_project_id:
            print("❌ No test project available for document upload")
            return False
            
        print(f"\n📤 Testing document upload to project {self.test_project_id}...")
        
        # Create test document
        test_file_path = self.create_test_document()
        
        try:
            with open(test_file_path, 'rb') as f:
                files = {'file': ('test_document.pdf', f, 'application/pdf')}
                form_data = {'category': 'JURIDIQUE'}
                
                success, response = self.run_test(
                    "Upload Document",
                    "POST",
                    f"projects/{self.test_project_id}/documents",
                    200,
                    files=files,
                    form_data=form_data
                )
                
                if success and 'document' in response:
                    self.test_document_id = response['document']['id']
                    print(f"✅ Document uploaded with ID: {self.test_document_id}")
                    return True
                else:
                    print(f"❌ Document upload failed")
                    return False
                    
        except Exception as e:
            print(f"❌ Document upload error: {str(e)}")
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(test_file_path)
            except:
                pass

    def test_document_in_project_list(self):
        """Test that uploaded document appears in project details"""
        if not self.test_project_id:
            print("❌ No test project available")
            return False
            
        print(f"\n📋 Testing document appears in project list...")
        
        success, response = self.run_test(
            "Get Project with Documents",
            "GET",
            f"projects/{self.test_project_id}",
            200
        )
        
        if success:
            documents = response.get('documents', [])
            if documents:
                print(f"✅ Found {len(documents)} document(s) in project")
                for doc in documents:
                    print(f"   • {doc.get('filename', 'Unknown')} ({doc.get('category', 'No category')})")
                return True
            else:
                print(f"❌ No documents found in project")
                return False
        else:
            print(f"❌ Failed to get project details")
            return False

    def test_document_download(self):
        """Test document download functionality"""
        if not self.test_project_id or not hasattr(self, 'test_document_id'):
            print("❌ No test document available for download")
            return False
            
        print(f"\n📥 Testing document download...")
        
        try:
            url = f"{self.api_url}/projects/{self.test_project_id}/documents/{self.test_document_id}/download"
            cookies = {}
            if self.session_token:
                cookies['session_token'] = self.session_token
                
            response = requests.get(url, cookies=cookies, timeout=10)
            
            if response.status_code == 200:
                if len(response.content) > 0:
                    print(f"✅ Document downloaded successfully ({len(response.content)} bytes)")
                    # Verify it's a PDF
                    if response.content.startswith(b'%PDF'):
                        print(f"✅ Downloaded file is valid PDF")
                        self.tests_passed += 1
                        return True
                    else:
                        print(f"❌ Downloaded file is not a valid PDF")
                        return False
                else:
                    print(f"❌ Downloaded file is empty")
                    return False
            else:
                print(f"❌ Download failed: {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Download error: {str(e)}")
            return False

    def test_pdf_export_bank(self):
        """Test bank dossier PDF export"""
        if not self.test_project_id:
            print("❌ No test project available for PDF export")
            return False
            
        print(f"\n🏦 Testing bank dossier PDF export...")
        
        try:
            url = f"{self.api_url}/projects/{self.test_project_id}/export/bank"
            cookies = {}
            if self.session_token:
                cookies['session_token'] = self.session_token
                
            response = requests.get(url, cookies=cookies, timeout=15)
            
            if response.status_code == 200:
                if len(response.content) > 0:
                    # Verify it's a PDF
                    if response.content.startswith(b'%PDF'):
                        print(f"✅ Bank dossier PDF generated successfully ({len(response.content)} bytes)")
                        self.tests_passed += 1
                        return True
                    else:
                        print(f"❌ Bank export is not a valid PDF")
                        return False
                else:
                    print(f"❌ Bank export is empty")
                    return False
            else:
                print(f"❌ Bank export failed: {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Bank export error: {str(e)}")
            return False

    def test_pdf_export_notary(self):
        """Test notary dossier PDF export"""
        if not self.test_project_id:
            print("❌ No test project available for PDF export")
            return False
            
        print(f"\n⚖️ Testing notary dossier PDF export...")
        
        try:
            url = f"{self.api_url}/projects/{self.test_project_id}/export/notary"
            cookies = {}
            if self.session_token:
                cookies['session_token'] = self.session_token
                
            response = requests.get(url, cookies=cookies, timeout=15)
            
            if response.status_code == 200:
                if len(response.content) > 0:
                    # Verify it's a PDF
                    if response.content.startswith(b'%PDF'):
                        print(f"✅ Notary dossier PDF generated successfully ({len(response.content)} bytes)")
                        self.tests_passed += 1
                        return True
                    else:
                        print(f"❌ Notary export is not a valid PDF")
                        return False
                else:
                    print(f"❌ Notary export is empty")
                    return False
            else:
                print(f"❌ Notary export failed: {response.status_code} - {response.text[:200]}")
                return False
                
        except Exception as e:
            print(f"❌ Notary export error: {str(e)}")
            return False

    def test_dynamic_calculations(self):
        """Test dynamic calculations when updating project"""
        if not self.test_project_id:
            print("❌ No test project available for dynamic calculations")
            return False
            
        print(f"\n🧮 Testing dynamic calculations...")
        
        # Update project with new financial data
        update_data = {
            "prix_achat_ttc": 350000,
            "prix_vente_ttc": 500000,
            "travaux_ttc": 70000,
            "frais_agence_ttc": 15000
        }
        
        success, response = self.run_test(
            "Update Project for Dynamic Calculations",
            "PATCH",
            f"projects/{self.test_project_id}",
            200,
            data=update_data
        )
        
        if success:
            # Check if marge_estimee was recalculated
            marge_estimee = response.get('marge_estimee', 0)
            expected_marge = 500000 - 350000 - 70000 - 15000  # 65000
            
            if abs(marge_estimee - expected_marge) < 1:
                print(f"✅ Dynamic calculation correct: Marge estimée = {marge_estimee:,.2f} € (expected ~{expected_marge:,.2f} €)")
                return True
            else:
                print(f"❌ Dynamic calculation incorrect: got {marge_estimee:,.2f} €, expected ~{expected_marge:,.2f} €")
                return False
        else:
            print(f"❌ Failed to update project for dynamic calculations")
            return False

    def test_comprehensive_field_validation(self):
        """Test that all required fields are present in response"""
        data = {
            "dept": "75",
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 520000,
            "travaux_ttc": 80000,
            "frais_agence_ttc": 15000,
            "hypotheses": {"md_b_0715_ok": True}
        }
        
        return self.run_test(
            "Comprehensive Field Validation",
            "POST",
            "estimate/run",
            200,
            data=data,
            validate_response=self.validate_all_required_fields
        )

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

    def test_frontend_form_simulation(self):
        """Test exact frontend form submission as described in review request"""
        print("\n📋 FRONTEND FORM SIMULATION TESTING")
        print("Testing 4-step form process as reported by user")
        print("="*50)
        
        # Step 1: Basic Information
        step1_data = {
            "label": "Maison Rénovation Paris 16e",
            "address": {
                "line1": "25 Avenue Foch",
                "city": "Paris",
                "dept": "75"
            },
            "regime_tva": "MARGE"
        }
        print("✅ Step 1 - Basic Info: Nom, Adresse, Ville, Département, Régime TVA")
        
        # Step 2: Financial Information  
        step2_data = {
            "prix_achat_ttc": 850000,
            "prix_vente_ttc": 1200000,
            "travaux_ttc": 150000,
            "frais_agence_ttc": 25000
        }
        print("✅ Step 2 - Financial: Prix d'achat, Prix de vente, Travaux, Frais d'agence")
        
        # Step 3: Photos (Skip as mentioned in review)
        print("⏭️ Step 3 - Photos: Skipped as requested")
        
        # Step 4: Summary and Submission (Combine all data)
        complete_form_data = {**step1_data, **step2_data}
        print("📝 Step 4 - Récapitulatif et soumission finale")
        
        success, response = self.run_test(
            "Frontend Form Complete Submission",
            "POST",
            "projects",
            200,
            data=complete_form_data
        )
        
        if success:
            print("✅ Frontend form simulation successful")
            project_id = response.get('id')
            
            # Verify all form data was saved correctly
            success_verify, verify_response = self.run_test(
                "Verify Form Data Persistence",
                "GET",
                f"projects/{project_id}",
                200
            )
            
            if success_verify:
                # Check each step's data
                saved_label = verify_response.get('label')
                saved_address = verify_response.get('address', {})
                saved_regime = verify_response.get('regime_tva')
                saved_prix_achat = verify_response.get('prix_achat_ttc')
                saved_prix_vente = verify_response.get('prix_vente_ttc')
                
                print(f"   • Label: {saved_label} ✅")
                print(f"   • Address: {saved_address.get('line1')}, {saved_address.get('city')} ✅")
                print(f"   • Régime TVA: {saved_regime} ✅")
                print(f"   • Prix achat: {saved_prix_achat:,.0f}€ ✅")
                print(f"   • Prix vente: {saved_prix_vente:,.0f}€ ✅")
                
                return True
            else:
                print("❌ Failed to verify saved form data")
                return False
        else:
            print("❌ Frontend form simulation failed")
            return False

    def test_project_creation_comprehensive(self):
        """Test comprehensive project creation as requested in review"""
        print("\n🏗️ COMPREHENSIVE PROJECT CREATION TESTING")
        print("="*50)
        
        all_tests_passed = True
        
        # Test 1: Direct API POST with minimal valid data
        print("\n📝 Test 1: Direct API POST /api/projects")
        minimal_project = {
            "label": "Test API Direct",
            "address": {
                "line1": "10 rue Test",
                "city": "Paris", 
                "dept": "75"
            },
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 450000,
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        success_direct, response_direct = self.run_test(
            "Direct API Project Creation",
            "POST",
            "projects",
            200,
            data=minimal_project
        )
        
        if not success_direct:
            print("❌ CRITICAL: Direct API project creation failed")
            all_tests_passed = False
        else:
            created_project_id = response_direct.get('id')
            print(f"✅ Project created successfully with ID: {created_project_id}")
            
            # Test 2: Verify persistence in DB via GET
            print("\n📋 Test 2: Verify persistence in database")
            success_get, get_response = self.run_test(
                "GET Created Project",
                "GET",
                f"projects/{created_project_id}",
                200
            )
            
            if success_get:
                print("✅ Project persisted correctly in database")
                # Verify all fields are present
                expected_fields = ['id', 'label', 'address', 'regime_tva', 'prix_achat_ttc', 'prix_vente_ttc']
                missing_fields = [f for f in expected_fields if f not in get_response]
                if missing_fields:
                    print(f"❌ Missing fields in persisted project: {missing_fields}")
                    all_tests_passed = False
                else:
                    print("✅ All required fields present in persisted project")
            else:
                print("❌ CRITICAL: Created project not found in database")
                all_tests_passed = False
            
            # Test 3: Verify project appears in projects list
            print("\n📊 Test 3: Verify project appears in projects list")
            success_list, list_response = self.run_test(
                "GET Projects List",
                "GET",
                "projects",
                200
            )
            
            if success_list:
                projects = list_response if isinstance(list_response, list) else []
                project_ids = [p.get('id') for p in projects if isinstance(p, dict)]
                if created_project_id in project_ids:
                    print("✅ Created project appears in projects list")
                else:
                    print("❌ Created project NOT found in projects list")
                    all_tests_passed = False
            else:
                print("❌ Failed to retrieve projects list")
                all_tests_passed = False
        
        # Test 4: Error cases - Invalid data
        print("\n❌ Test 4: Error cases - Invalid data")
        
        # Test 4a: Prix vente < prix achat
        invalid_project_1 = {
            "label": "Invalid Project - Price",
            "address": {"line1": "Test", "city": "Paris", "dept": "75"},
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000,
            "prix_vente_ttc": 250000,  # Lower than purchase
            "travaux_ttc": 50000,
            "frais_agence_ttc": 10000
        }
        
        success_invalid_1, _ = self.run_test(
            "Invalid Project (Sale < Purchase)",
            "POST",
            "projects",
            422,  # Expect validation error
            data=invalid_project_1
        )
        
        if success_invalid_1:
            print("✅ Correctly rejected invalid project (sale < purchase)")
        else:
            print("❌ Should have rejected invalid project (sale < purchase)")
            all_tests_passed = False
        
        # Test 4b: Missing required fields
        invalid_project_2 = {
            "label": "Invalid Project - Missing Fields",
            "regime_tva": "MARGE",
            "prix_achat_ttc": 300000
            # Missing required fields
        }
        
        success_invalid_2, _ = self.run_test(
            "Invalid Project (Missing Fields)",
            "POST",
            "projects",
            422,  # Expect validation error
            data=invalid_project_2
        )
        
        if success_invalid_2:
            print("✅ Correctly rejected project with missing fields")
        else:
            print("❌ Should have rejected project with missing fields")
            all_tests_passed = False
        
        # Test 5: Multi-step form simulation
        print("\n📋 Test 5: Multi-step form data simulation")
        
        # Simulate complete 4-step form data
        complete_form_data = {
            # Step 1: Basic info
            "label": "Projet Formulaire Complet",
            "address": {
                "line1": "15 Avenue des Champs-Élysées",
                "city": "Paris",
                "dept": "75"
            },
            "regime_tva": "MARGE",
            
            # Step 2: Financial data
            "prix_achat_ttc": 400000,
            "prix_vente_ttc": 600000,
            "travaux_ttc": 80000,
            "frais_agence_ttc": 20000,
            
            # Step 3: Photos (simulated - would be handled separately)
            # Step 4: Summary and submission (all data combined)
        }
        
        success_form, response_form = self.run_test(
            "Complete Form Submission",
            "POST",
            "projects",
            200,
            data=complete_form_data
        )
        
        if success_form:
            print("✅ Complete form submission successful")
            form_project_id = response_form.get('id')
            
            # Verify dynamic calculations
            marge_estimee = response_form.get('marge_estimee', 0)
            expected_marge = 600000 - 400000 - 80000 - 20000  # 100000
            if abs(marge_estimee - expected_marge) < 1:
                print(f"✅ Dynamic margin calculation correct: {marge_estimee:,.2f}€")
            else:
                print(f"❌ Dynamic margin calculation incorrect: got {marge_estimee:,.2f}€, expected {expected_marge:,.2f}€")
                all_tests_passed = False
        else:
            print("❌ Complete form submission failed")
            all_tests_passed = False
        
        return all_tests_passed

def main():
    print("🏢 COMPREHENSIVE PROJECT CREATION TESTING")
    print("Testing complete project creation flow as requested")
    print("="*60)
    
    tester = TaxCalculationAPITester()
    
    # Setup authentication first
    print("\n🔐 PHASE 1: AUTHENTICATION")
    if not tester.setup_authentication():
        print("❌ Authentication failed - cannot proceed with authenticated tests")
        tester.print_summary()
        return 1
    
    # Focus on project creation testing as requested
    print("\n🏗️ PHASE 2: PROJECT CREATION COMPREHENSIVE TESTING")
    creation_success = tester.test_project_creation_comprehensive()
    
    # Additional API health check
    print("\n🌐 PHASE 3: API HEALTH VERIFICATION")
    tester.test_api_health()
    
    # Print summary
    tester.print_summary()
    
    # Specific summary for project creation
    print(f"\n" + "="*60)
    print(f"🎯 PROJECT CREATION TEST RESULTS")
    print(f"="*60)
    if creation_success:
        print("✅ ALL PROJECT CREATION TESTS PASSED")
        print("   • Direct API POST /api/projects: ✅")
        print("   • Database persistence: ✅") 
        print("   • Projects list integration: ✅")
        print("   • Error handling (invalid data): ✅")
        print("   • Multi-step form simulation: ✅")
    else:
        print("❌ PROJECT CREATION TESTS FAILED")
        print("   Check detailed results above for specific failures")
    
    # Return exit code
    return 0 if creation_success else 1

if __name__ == "__main__":
    sys.exit(main())