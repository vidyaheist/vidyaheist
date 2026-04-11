
const KEY_ID = 'rzp_live_SbIQsEJRI3UGMh';
const KEY_SECRET = 'so6ZFPHMaQaBr14xc6M7pdNg';

async function testRazorpay() {
    const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
    try {
        const res = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify({
                amount: 100,
                currency: 'INR',
                receipt: 'test_receipt'
            })
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testRazorpay();
