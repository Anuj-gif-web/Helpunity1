const express = require('express');
const cors = require('cors');
const stripe = require('stripe')('sk_test_51Pf9ZIRxmDdLIyjvYXHrVOEzA3Uj2UcoBYooNYzKGcz1EECYz6KVb4iaHeO9qBN7rGWT91dStLIugnbGD3DgLYcy00WXPq6WpI'); // Replace with your Stripe secret key

const app = express();
app.use(cors());
app.use(express.json());

app.post('/create-account-link', async (req, res) => {
  const { userId } = req.body;
  try {
    const account = await stripe.accounts.create({ type: 'standard' });
    // Save the account ID to your database (pseudo-code)
    // await saveStripeAccountId(userId, account.id);

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/refresh',
      return_url: 'http://localhost:3000/return',
      type: 'account_onboarding',
    });

    res.send({ url: accountLink.url });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.post('/create-payment-intent', async (req, res) => {
  const { amount, organizerAccountId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      transfer_data: {
        destination: organizerAccountId,
      },
    });

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
