# Payments — Phase 2 (Stripe Connect)

When ready to collect money through the app:

1. Add Stripe Connect for commissioners
   - Commissioner onboards via Stripe (bank account)
   - Members pay at bracket submission
   - Money held in Stripe until tournament ends
   - Commissioner triggers payout

2. Env vars needed:
   - STRIPE_SECRET_KEY
   - STRIPE_PUBLISHABLE_KEY
   - STRIPE_WEBHOOK_SECRET

3. Key flows:
   - Pool creation → commissioner sets up Stripe account
   - Join + pay → Stripe Checkout session
   - Tournament end → automated payout via Stripe Connect transfers
