import { loadStripe } from '@stripe/stripe-js';

// Replace with your actual Publishable Key from Stripe Dashboard
const STRIPE_PUBLISHABLE_KEY = 'pk_test_your_publishable_key_here';

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};

export const stripeService = {
    /**
     * Redirects to Stripe Checkout for subscription
     * @param priceId The Stripe Price ID (e.g. price_12345)
     * @param agencyId The internal Agency ID
     */
    async createCheckoutSession(priceId: string, agencyId: string) {
        // In a real app, you would call your backend here to create the session
        // const response = await fetch('/api/create-checkout-session', { ... });
        // const session = await response.json();

        console.log(`[Stripe] Creating checkout session for price ${priceId} agency ${agencyId}`);

        const stripe = await getStripe();
        if (!stripe) throw new Error('Stripe failed to load');

        // MOCK: Since we don't have a backend running, we simulate the flow
        // In production: await stripe.redirectToCheckout({ sessionId: session.id });
        alert(`[SIMULATION] Redirecting to Stripe Checkout for price: ${priceId}`);
        return true;
    },

    /**
     * Redirects to Customer Portal for billing management
     */
    async openCustomerPortal(customerId: string) {
        console.log(`[Stripe] Opening customer portal for ${customerId}`);
        // await fetch('/api/create-portal-session', ...);
        alert('[SIMULATION] Redirecting to Stripe Customer Portal');
    }
};
