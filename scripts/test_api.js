// Node 20 has built-in fetch

// Node v20 has built-in fetch
async function testCheckout() {
  const variantId = 'mkl3rg7da9giwi8b0mj';
  try {
    const response = await fetch('http://localhost:3001/api/checkout/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    fileText = await response.text();
    console.log('Status:', response.status);
    console.log('Response Text:', fileText);
    try {
        const data = JSON.parse(fileText);
        console.log('Response JSON:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Response is not JSON');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCheckout();
