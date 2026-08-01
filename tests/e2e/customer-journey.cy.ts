describe('Customer Journey', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/products*', { fixture: 'products.json' }).as('getProducts');
    cy.intercept('GET', '/api/categories*', { fixture: 'categories.json' }).as('getCategories');
  });

  it('should allow user to browse products and add to cart', () => {
    cy.visit('/');
    cy.wait('@getProducts');
    cy.wait('@getCategories');

    // Verify products are displayed
    cy.get('[data-testid="product-card"]').should('have.length.greaterThan', 0);

    // Click on first product
    cy.get('[data-testid="product-card"]').first().click();
    cy.url().should('include', '/products/');

    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    cy.contains('Added to cart').should('be.visible');

    // Go to cart
    cy.get('[data-testid="cart-link"]').click();
    cy.url().should('include', '/cart');

    // Verify item in cart
    cy.get('[data-testid="cart-item"]').should('have.length', 1);
  });

  it('should allow user to register and login', () => {
    const email = `test${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    cy.visit('/register');
    cy.get('[data-testid="first-name"]').type('John');
    cy.get('[data-testid="last-name"]').type('Doe');
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password);
    cy.get('[data-testid="confirm-password"]').type(password);
    cy.get('[data-testid="role-customer"]').check();
    cy.get('[data-testid="terms"]').check();
    cy.get('[data-testid="register-submit"]').click();

    // Should redirect to home after successful registration
    cy.url().should('eq', Cypress.config().baseUrl + '/');

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Logout').click();

    // Login
    cy.visit('/login');
    cy.get('[data-testid="email"]').type(email);
    cy.get('[data-testid="password"]').type(password);
    cy.get('[data-testid="login-submit"]').click();

    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should allow user to checkout', () => {
    // Add item to cart first
    cy.visit('/products');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart"]').click();

    // Go to checkout
    cy.visit('/checkout');
    cy.wait('@getProducts');

    // Fill shipping address
    cy.get('[data-testid="full-name"]').type('John Doe');
    cy.get('[data-testid="phone"]').type('+919876543210');
    cy.get('[data-testid="address-line1"]').type('123 Main Street');
    cy.get('[data-testid="city"]').type('Mumbai');
    cy.get('[data-testid="state"]').type('Maharashtra');
    cy.get('[data-testid="postal-code"]').type('400001');

    // Select payment method
    cy.get('[data-testid="payment-razorpay"]').check();

    // Place order
    cy.get('[data-testid="place-order"]').click();

    // Should redirect to success page
    cy.url().should('include', '/checkout');
    cy.contains('Order Confirmed').should('be.visible');
  });
});