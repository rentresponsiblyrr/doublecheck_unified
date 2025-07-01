describe('PWA and Offline Functionality', () => {
  beforeEach(() => {
    cy.setMobileViewport();
  });

  describe('PWA Installation', () => {
    it('should have PWA manifest', () => {
      cy.request('/manifest.json').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('name', 'STR Certified Inspector');
        expect(response.body).to.have.property('short_name', 'STR Inspector');
        expect(response.body).to.have.property('display', 'standalone');
        expect(response.body).to.have.property('theme_color', '#3b82f6');
      });
    });

    it('should register service worker', () => {
      cy.visit('/');
      cy.waitForServiceWorker();
      
      cy.window().then((win) => {
        expect(win.navigator.serviceWorker.controller).to.not.be.null;
      });
    });

    it('should prompt for installation', () => {
      cy.visit('/');
      cy.mockPWAInstall();
      
      // Trigger install event
      cy.get('@installPrompt').should('have.been.called');
    });
  });

  describe('Offline Mode', () => {
    beforeEach(() => {
      cy.login();
      cy.waitForServiceWorker();
    });

    it('should cache critical resources', () => {
      // Visit pages to cache them
      cy.visit('/inspector');
      cy.wait(1000);
      
      // Go offline
      cy.goOffline();
      
      // Should still be able to navigate cached pages
      cy.reload();
      cy.get('h1').should('contain', 'Welcome back');
    });

    it('should show offline indicator', () => {
      cy.goOffline();
      
      // Check for offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      cy.contains('Offline Mode').should('exist');
    });

    it('should queue actions while offline', () => {
      // Mock inspection update
      cy.intercept('POST', '/api/trpc/checklist.updateItem', {
        statusCode: 200,
        body: { result: { data: { id: 'item-1', status: 'COMPLETED' } } },
      }).as('updateItem');

      cy.goOffline();
      
      // Try to update item while offline
      cy.get('[data-testid="checklist-item"]').first().click();
      cy.get('[data-testid="mark-complete"]').click();
      
      // Should show pending state
      cy.get('[data-testid="sync-pending"]').should('be.visible');
      
      // Go back online
      cy.goOnline();
      
      // Should sync automatically
      cy.wait('@updateItem');
      cy.get('[data-testid="sync-pending"]').should('not.exist');
    });
  });

  describe('Background Sync', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should sync data when connection restored', () => {
      cy.intercept('POST', '/api/trpc/inspection.sync', {
        statusCode: 200,
        body: { result: { data: { synced: true } } },
      }).as('syncData');

      // Simulate offline work
      cy.goOffline();
      cy.wait(1000);
      cy.goOnline();
      
      // Should trigger sync
      cy.wait('@syncData');
    });
  });

  describe('Offline Media Upload', () => {
    beforeEach(() => {
      cy.login();
    });

    it('should queue media uploads while offline', () => {
      cy.visit('/inspector/inspection/1');
      
      cy.goOffline();
      
      // Try to upload image
      cy.get('[data-testid="photo-upload"]').selectFile({
        contents: Cypress.Buffer.from('fake-image'),
        fileName: 'test.jpg',
        mimeType: 'image/jpeg',
      });
      
      // Should show in queue
      cy.get('[data-testid="upload-queue"]').should('contain', '1 pending upload');
      
      cy.goOnline();
      
      // Should upload automatically
      cy.get('[data-testid="upload-queue"]').should('not.exist');
    });
  });

  describe('Local Storage Persistence', () => {
    it('should persist inspection data locally', () => {
      cy.login();
      cy.visit('/inspector/inspection/1');
      
      // Make some changes
      cy.get('[data-testid="checklist-item"]').first().click();
      cy.get('[data-testid="add-note"]').type('Test note');
      
      // Reload page
      cy.reload();
      
      // Data should persist
      cy.get('[data-testid="add-note"]').should('have.value', 'Test note');
    });
  });
});