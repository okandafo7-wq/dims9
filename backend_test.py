import requests
import sys
import json
from datetime import datetime

class DIMSAPITester:
    def __init__(self, base_url="https://agri-twins.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    details = f"Status: {response.status_code}, Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}"
                except:
                    details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            else:
                details = f"Expected {expected_status}, got {response.status_code}. Response: {response.text[:200]}"

            self.log_result(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"testuser{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!",
            "role": "farmer"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.test_user_email = test_user_data['email']
            return True
        return False

    def test_user_login(self):
        """Test user login with registered user"""
        if not hasattr(self, 'test_user_email'):
            self.log_result("User Login", False, "No registered user available for login test")
            return False
            
        login_data = {
            "email": self.test_user_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            auth_required=False
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_initialize_data(self):
        """Test initializing dummy data"""
        success, response = self.run_test(
            "Initialize Dummy Data",
            "POST",
            "init-data",
            200
        )
        return success

    def test_get_farms(self):
        """Test getting all farms"""
        success, response = self.run_test(
            "Get All Farms",
            "GET",
            "farms",
            200
        )
        
        if success and isinstance(response, list):
            self.farms_data = response
            self.log_result("Farms Data Validation", len(response) > 0, f"Found {len(response)} farms")
            return True
        return False

    def test_get_single_farm(self):
        """Test getting a single farm by ID"""
        if not hasattr(self, 'farms_data') or not self.farms_data:
            self.log_result("Get Single Farm", False, "No farms data available")
            return False
            
        farm_id = self.farms_data[0]['id']
        success, response = self.run_test(
            "Get Single Farm",
            "GET",
            f"farms/{farm_id}",
            200
        )
        return success

    def test_create_farm(self):
        """Test creating a new farm"""
        farm_data = {
            "farm_name": f"Test Farm {datetime.now().strftime('%H%M%S')}",
            "location": "Test Location, India",
            "area_hectares": 25.5,
            "crop_type": "Test Crop",
            "growth_stage": "Testing",
            "health_status": "Good",
            "temperature": 26.0,
            "humidity": 70.0,
            "soil_moisture": 75.0,
            "predicted_yield": 2500.0
        }
        
        success, response = self.run_test(
            "Create New Farm",
            "POST",
            "farms",
            200,
            data=farm_data
        )
        return success

    def test_get_esg_metrics(self):
        """Test getting ESG metrics"""
        success, response = self.run_test(
            "Get ESG Metrics",
            "GET",
            "esg",
            200
        )
        
        if success and isinstance(response, list):
            self.esg_data = response
            self.log_result("ESG Data Validation", len(response) > 0, f"Found {len(response)} ESG records")
            return True
        return False

    def test_create_esg_metric(self):
        """Test creating a new ESG metric"""
        esg_data = {
            "period": f"2024-TEST-{datetime.now().strftime('%H%M')}",
            "water_usage": 120000,
            "carbon_footprint": 800,
            "waste_reduced": 350,
            "renewable_energy": 40.0,
            "women_employed": 50,
            "training_hours": 160.0,
            "income_growth": 20.0,
            "iso9001_score": 88.0,
            "iso14001_score": 85.0,
            "iso45001_score": 91.0,
            "audit_compliance": 95.0
        }
        
        success, response = self.run_test(
            "Create ESG Metric",
            "POST",
            "esg",
            200,
            data=esg_data
        )
        return success

    def test_invalid_endpoints(self):
        """Test invalid endpoints return proper errors"""
        # Test non-existent farm
        success, response = self.run_test(
            "Get Non-existent Farm",
            "GET",
            "farms/invalid-id",
            404
        )
        
        # Test unauthorized access
        old_token = self.token
        self.token = "invalid-token"
        success2, response2 = self.run_test(
            "Unauthorized Access Test",
            "GET",
            "farms",
            401
        )
        self.token = old_token
        
        return success and success2

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting DIMS API Testing...")
        print(f"📍 Testing against: {self.api_url}")
        print("=" * 60)

        # Authentication tests
        print("\n🔐 Authentication Tests:")
        if not self.test_user_registration():
            print("❌ Registration failed, stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed, stopping tests")
            return False
            
        self.test_get_current_user()

        # Data initialization
        print("\n📊 Data Initialization Tests:")
        self.test_initialize_data()

        # Farm management tests
        print("\n🌾 Farm Management Tests:")
        self.test_get_farms()
        self.test_get_single_farm()
        self.test_create_farm()

        # ESG tests
        print("\n📈 ESG Reporting Tests:")
        self.test_get_esg_metrics()
        self.test_create_esg_metric()

        # Error handling tests
        print("\n⚠️ Error Handling Tests:")
        self.test_invalid_endpoints()

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️ Warning: Low success rate detected")
        elif success_rate == 100:
            print("🎉 All tests passed!")
        
        return success_rate >= 80

def main():
    tester = DIMSAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump({
            'summary': {
                'total_tests': tester.tests_run,
                'passed_tests': tester.tests_passed,
                'success_rate': (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0,
                'timestamp': datetime.now().isoformat()
            },
            'detailed_results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())