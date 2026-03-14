# PayPal Setup Guide

## Step 1: Create PayPal Business Account
1. Go to https://paypal.com/business → sign up or upgrade existing account
2. Complete business verification

## Step 2: Create Developer App
1. Go to https://developer.paypal.com/developer/applications
2. Click "Create App" → choose "Merchant"
3. App Name: UFSL Bracket
4. Copy Client ID and Secret (Sandbox first, then Live)

## Step 3: Enable Marketplace / Connect (Partner Referrals)
1. Contact PayPal to enable Partner Referrals API access
   (or use existing business account with Checkout enabled)
2. Get your BN Code (Build Notation) from PayPal partner team

## Step 4: Set Up Webhook
1. Go to https://developer.paypal.com/developer/webhooksSimulator
2. Add webhook URL: https://ufsl.net/api/webhooks/paypal
3. Subscribe to: CHECKOUT.ORDER.APPROVED, PAYMENT.CAPTURE.COMPLETED
4. Copy your Webhook ID

## Step 5: Give HAL these values
- PAYPAL_CLIENT_ID: (from Step 2)
- PAYPAL_CLIENT_SECRET: (from Step 2)
- NEXT_PUBLIC_PAYPAL_CLIENT_ID: (same as CLIENT_ID)
- PAYPAL_WEBHOOK_ID: (from Step 4)
- PAYPAL_BN_CODE: (from Step 3, can be left blank initially)

HAL will update Vercel and activate in ~5 minutes.
