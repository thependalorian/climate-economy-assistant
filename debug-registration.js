// Debug Registration Flow Script
// Run this in the browser console on your site to debug the registration issue

console.log('🔍 Debug Registration Flow');
console.log('=========================');

// Check localStorage data
console.log('📱 localStorage Data:');
console.log('- pendingUserType:', localStorage.getItem('pendingUserType'));
console.log('- pendingFirstName:', localStorage.getItem('pendingFirstName'));
console.log('- pendingLastName:', localStorage.getItem('pendingLastName'));
console.log('- pendingOrganization:', localStorage.getItem('pendingOrganization'));
console.log('- pendingConfirmationEmail:', localStorage.getItem('pendingConfirmationEmail'));

// Check current URL
console.log('🌐 Current URL:', window.location.href);
console.log('🌐 Current Path:', window.location.pathname);

// Check if we're in AuthCallback
if (window.location.pathname === '/auth/callback') {
  console.log('✅ Currently in AuthCallback');
  
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  console.log('🔗 URL Parameters:');
  for (const [key, value] of urlParams.entries()) {
    console.log(`  - ${key}: ${value}`);
  }
}

// Function to simulate user type selection and check storage
window.debugSelectUserType = function(type) {
  console.log(`🎯 Testing user type selection: ${type}`);
  localStorage.setItem('pendingUserType', type);
  console.log('✅ Stored user type:', localStorage.getItem('pendingUserType'));
};

// Function to simulate registration data storage
window.debugStoreRegistrationData = function(email, firstName, lastName, userType) {
  console.log('📝 Storing registration data...');
  localStorage.setItem('pendingConfirmationEmail', email);
  localStorage.setItem('pendingUserType', userType);
  localStorage.setItem('pendingFirstName', firstName);
  localStorage.setItem('pendingLastName', lastName);
  
  console.log('✅ Stored registration data:');
  console.log('- Email:', localStorage.getItem('pendingConfirmationEmail'));
  console.log('- User Type:', localStorage.getItem('pendingUserType'));
  console.log('- First Name:', localStorage.getItem('pendingFirstName'));
  console.log('- Last Name:', localStorage.getItem('pendingLastName'));
};

// Function to clear debug data
window.debugClear = function() {
  console.log('🧹 Clearing localStorage debug data...');
  localStorage.removeItem('pendingConfirmationEmail');
  localStorage.removeItem('pendingUserType');
  localStorage.removeItem('pendingFirstName');
  localStorage.removeItem('pendingLastName');
  localStorage.removeItem('pendingOrganization');
  console.log('✅ localStorage cleared');
};

console.log('📋 Available debug functions:');
console.log('- debugSelectUserType("job_seeker" | "partner")');
console.log('- debugStoreRegistrationData(email, firstName, lastName, userType)');
console.log('- debugClear()');
console.log('');
console.log('💡 Try: debugStoreRegistrationData("test@example.com", "John", "Doe", "job_seeker")'); 