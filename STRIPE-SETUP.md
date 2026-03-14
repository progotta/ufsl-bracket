# Stripe Setup Guide

## Step 1: Create Stripe Account
1. Go to https://stripe.com → Sign up
2. Complete business verification (can start in test mode)

## Step 2: Get API Keys
1. Go to https://dashboard.stripe.com/developers
2. Copy your keys:
   - Secret key (starts with sk_live_ or sk_test_)
   - Publishable key (starts with pk_live_ or pk_test_)

## Step 3: Enable Stripe Connect
1. Go to https://dashboard.stripe.com/connect/settings
2. Enable "Express" accounts
3. Copy your Connect Client ID (starts with ca_)

## Step 4: Set Up Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: https://ufsl.net/api/webhooks/stripe
3. Select events: checkout.session.completed
4. Copy the Signing Secret (starts with whsec_)

## Step 5: Give HAL these values
- STRIPE_SECRET_KEY: sk_live_...
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_live_...
- STRIPE_CLIENT_ID: ca_...
- STRIPE_WEBHOOK_SECRET: whsec_...

HAL will add them to Vercel and activate the integration in ~5 minutes.
