describe('Inspector Flow - Mobile', () => {
  beforeEach(() => {
    cy.setMobileViewport('iphone-x');
    cy.visit('/');
  });

  describe('Authentication', () => {
    it('should redirect to login when not authenticated', () => {
      cy.url().should('include', '/auth/signin');
    });

    it('should login successfully', () => {
      cy.login();
      cy.url().should('include', '/inspector');
      cy.get('h1').should('contain', 'Welcome back');
    });
  });

  describe('Inspector Dashboard', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should display mobile-optimized dashboard', () => {
      // Check mobile container
      cy.get('.mobile-container').should('exist');
      
      // Check quick stats
      cy.get('[data-testid="quick-stats"]').within(() => {
        cy.contains('Completed Today').should('be.visible');
        cy.contains('In Progress').should('be.visible');
        cy.contains('Pending Review').should('be.visible');
      });

      // Check bottom navigation
      cy.get('nav').should('be.visible');
      cy.get('nav a').should('have.length', 4);
    });

    it('should navigate between tabs', () => {
      // Click on Active tab
      cy.contains('button', 'Active').click();
      cy.get('.border-primary').should('contain', 'Active');

      // Click on Scheduled tab
      cy.contains('button', 'Scheduled').click();
      cy.get('.border-primary').should('contain', 'Scheduled');

      // Click on Completed tab  
      cy.contains('button', 'Completed').click();
      cy.get('.border-primary').should('contain', 'Completed');
    });

    it('should display inspection cards', () => {
      cy.get('[data-testid="inspection-card"]').should('have.length.at.least', 1);
      
      cy.get('[data-testid="inspection-card"]').first().within(() => {
        cy.get('h3').should('exist'); // Property name
        cy.contains('items').should('exist'); // Item count
        cy.get('[role="progressbar"]').should('exist'); // Progress bar
      });
    });
  });

  describe('Bottom Navigation', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should navigate to different sections', () => {
      // Test each navigation item
      cy.get('nav a[href="/inspector/active"]').click();
      cy.url().should('include', '/inspector/active');

      cy.get('nav a[href="/inspector/capture"]').click();
      cy.url().should('include', '/inspector/capture');

      cy.get('nav a[href="/inspector/profile"]').click();
      cy.url().should('include', '/inspector/profile');

      cy.get('nav a[href="/inspector"]').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/inspector');
    });

    it('should highlight active navigation item', () => {
      cy.get('nav a[href="/inspector"]')
        .should('have.class', 'text-primary');
    });
  });

  describe('Touch Interactions', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should handle touch events on inspection cards', () => {
      cy.get('[data-testid="inspection-card"]').first()
        .trigger('touchstart')
        .trigger('touchend')
        .click();
      
      cy.url().should('include', '/inspector/inspection/');
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should adapt to different mobile viewports', () => {
      const devices = ['iphone-x', 'iphone-14', 'pixel-5', 'samsung-s21'];
      
      devices.forEach(device => {
        cy.setMobileViewport(device);
        cy.get('.mobile-container').should('be.visible');
        cy.get('nav').should('be.visible');
      });
    });

    it('should handle orientation changes', () => {
      // Portrait
      cy.viewport(375, 812);
      cy.get('.mobile-container').should('be.visible');
      
      // Landscape
      cy.viewport(812, 375);
      cy.get('.mobile-container').should('be.visible');
    });
  });
});