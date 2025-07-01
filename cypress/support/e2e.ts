// ***********************************************************
// This file is processed and loaded automatically before your test files.
// ***********************************************************

import './commands';

// Preserve cookies between tests
Cypress.Cookies.defaults({
  preserve: ['next-auth.session-token', 'next-auth.csrf-token'],
});

// Mobile viewport helper
Cypress.Commands.add('setMobileViewport', (device = 'iphone-x') => {
  const viewports = {
    'iphone-x': { width: 375, height: 812 },
    'iphone-14': { width: 390, height: 844 },
    'pixel-5': { width: 393, height: 851 },
    'samsung-s21': { width: 360, height: 800 },
  };

  const viewport = viewports[device] || viewports['iphone-x'];
  cy.viewport(viewport.width, viewport.height);
});

// Touch event helpers
Cypress.Commands.add('swipeLeft', (selector: string) => {
  cy.get(selector)
    .trigger('touchstart', { touches: [{ clientX: 300, clientY: 400 }] })
    .trigger('touchmove', { touches: [{ clientX: 100, clientY: 400 }] })
    .trigger('touchend');
});

Cypress.Commands.add('swipeRight', (selector: string) => {
  cy.get(selector)
    .trigger('touchstart', { touches: [{ clientX: 100, clientY: 400 }] })
    .trigger('touchmove', { touches: [{ clientX: 300, clientY: 400 }] })
    .trigger('touchend');
});

// PWA installation helper
Cypress.Commands.add('mockPWAInstall', () => {
  cy.window().then((win) => {
    // Mock the beforeinstallprompt event
    const event = new Event('beforeinstallprompt');
    event['prompt'] = cy.stub().as('installPrompt');
    event['userChoice'] = Promise.resolve({ outcome: 'accepted' });
    win.dispatchEvent(event);
  });
});

// Service Worker helpers
Cypress.Commands.add('waitForServiceWorker', () => {
  cy.window().then((win) => {
    if ('serviceWorker' in win.navigator) {
      return win.navigator.serviceWorker.ready;
    }
  });
});

// Offline mode simulation
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    cy.log('Going offline');
    cy.wrap(win.navigator).its('onLine').should('be.true');
    cy.window().trigger('offline');
  });
});

Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    cy.log('Going online');
    cy.window().trigger('online');
    cy.wrap(win.navigator).its('onLine').should('be.true');
  });
});

// Authentication helpers
Cypress.Commands.add('login', (email = 'john@strcertified.com', password = 'inspector123') => {
  cy.visit('/auth/signin');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/inspector');
});

// TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      setMobileViewport(device?: string): Chainable<void>;
      swipeLeft(selector: string): Chainable<void>;
      swipeRight(selector: string): Chainable<void>;
      mockPWAInstall(): Chainable<void>;
      waitForServiceWorker(): Chainable<void>;
      goOffline(): Chainable<void>;
      goOnline(): Chainable<void>;
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}