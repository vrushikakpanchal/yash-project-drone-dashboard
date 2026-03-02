// Quick test script to verify API connection
// Run with: node test-api-connection.js

const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
  console.log('🔍 Testing API connection to backend...\n');
  
  try {
    // Test health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test get-data endpoint  
    console.log('\n2️⃣ Testing get-data endpoint...');
    const dataResponse = await fetch(`${API_BASE_URL}/get-data`);
    const data = await dataResponse.json();
    console.log('✅ Get data:', data);
    
    // Test start stream
    console.log('\n3️⃣ Testing start stream...');
    const startResponse = await fetch(`${API_BASE_URL}/start-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const startResult = await startResponse.json();
    console.log('✅ Start stream:', startResult);
    
    // Wait a few seconds to collect some data
    console.log('\n⏳ Waiting 3 seconds to collect data...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test stop stream
    console.log('\n4️⃣ Testing stop stream...');
    const stopResponse = await fetch(`${API_BASE_URL}/stop-stream`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }
    });
    const stopResult = await stopResponse.json();
    console.log('✅ Stop stream:', stopResult);
    
    // Test analysis data
    console.log('\n5️⃣ Testing analysis data...');
    const analysisResponse = await fetch(`${API_BASE_URL}/analysis-data`);
    const analysisResult = await analysisResponse.json();
    console.log('✅ Analysis data:', {
      status: analysisResult.status,
      hasData: !!analysisResult.data,
      sessionInfo: analysisResult.data?.session_info,
      thrustPoints: analysisResult.data?.thrust_analysis?.length,
      anomalyPoints: analysisResult.data?.anomaly_analysis?.length,
      healthPoints: analysisResult.data?.health_analysis?.length
    });
    
    console.log('\n🎉 All API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\nMake sure your backend is running on port 8000');
    console.log('Run: cd backend && uvicorn app:app --port 8000');
  }
}

testAPI();