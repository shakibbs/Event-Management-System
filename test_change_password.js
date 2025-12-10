const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8083';

// Test credentials (use existing user)
const LOGIN_REQUEST = {
    email: 'shakib@ems.com',
    password: '123456'
};

const CHANGE_PASSWORD_REQUEST = {
    oldPassword: '123456',
    newPassword: '654321',
    confirmPassword: '654321'
};

async function testChangePassword() {
    try {
        console.log('1. Testing login...');
        
        // Step 1: Login to get access token
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, LOGIN_REQUEST);
        console.log('Login successful:', loginResponse.data);
        
        const accessToken = loginResponse.data.accessToken;
        console.log('Access token obtained');
        
        // Step 2: Test change password endpoint
        console.log('\n2. Testing change password...');
        
        const changePasswordResponse = await axios.post(
            `${BASE_URL}/api/auth/change-password`,
            CHANGE_PASSWORD_REQUEST,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Change password successful:', changePasswordResponse.data);
        console.log('\n✅ TEST PASSED: Change password endpoint is working correctly!');
        
        // Step 3: Test login with new password to verify it was changed
        console.log('\n3. Testing login with new password...');
        
        const newLoginRequest = {
            email: 'shakib@ems.com',
            password: '654321'
        };
        
        const newLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, newLoginRequest);
        console.log('Login with new password successful:', newLoginResponse.data);
        
        // Step 4: Change password back to original
        console.log('\n4. Changing password back to original...');
        
        const revertPasswordRequest = {
            oldPassword: '654321',
            newPassword: '123456',
            confirmPassword: '123456'
        };
        
        const newAccessToken = newLoginResponse.data.accessToken;
        
        const revertResponse = await axios.post(
            `${BASE_URL}/api/auth/change-password`,
            revertPasswordRequest,
            {
                headers: {
                    'Authorization': `Bearer ${newAccessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Password reverted successfully:', revertResponse.data);
        console.log('\n✅ ALL TESTS PASSED: Change password functionality is working correctly!');
        
    } catch (error) {
        console.error('\n❌ TEST FAILED:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else if (error.request) {
            console.error('Request made but no response received:', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
    }
}

// Run the test
testChangePassword();