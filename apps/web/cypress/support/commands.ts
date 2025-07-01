/// <reference types="cypress" />

// Custom commands for STR Certified testing

// API mocking helper
Cypress.Commands.add('mockAPI', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response).as(url.split('/').pop() || 'api');
});

// Wait for hydration
Cypress.Commands.add('waitForHydration', () => {
  cy.document().its('readyState').should('eq', 'complete');
  cy.wait(100); // Small delay for React hydration
});

// Check mobile viewport
Cypress.Commands.add('checkMobileViewport', () => {
  cy.viewport('iphone-x');
  cy.get('body').should('have.css', 'overflow-x', 'hidden');
});

export {};