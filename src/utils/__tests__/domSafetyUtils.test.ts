/**
 * DOM Safety Utils - Comprehensive Test Suite
 * 
 * Tests all edge cases identified in the system audit and ensures
 * bulletproof handling of DOM API inconsistencies across browsers.
 * 
 * @author STR Certified Engineering Team
 * @version 1.0.0 - Elite Test Standards
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DOMSafetyUtils } from '../domSafetyUtils';

// Mock logger to prevent test noise
vi.mock('@/lib/logger/production-logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

describe('DOMSafetyUtils', () => {
  let testContainer: HTMLDivElement;

  beforeEach(() => {
    // Create clean test environment
    testContainer = document.createElement('div');
    testContainer.id = 'test-container';
    document.body.appendChild(testContainer);
  });

  afterEach(() => {
    // Clean up test environment
    if (testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  });

  describe('getElementClasses', () => {
    it('should handle null element gracefully', () => {
      const result = DOMSafetyUtils.getElementClasses(null);
      expect(result).toEqual([]);
    });

    it('should handle undefined element gracefully', () => {
      const result = DOMSafetyUtils.getElementClasses(undefined as any);
      expect(result).toEqual([]);
    });

    it('should extract classes from string className', () => {
      const element = document.createElement('div');
      element.className = 'class1 class2 class3';
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual(['class1', 'class2', 'class3']);
    });

    it('should handle empty string className', () => {
      const element = document.createElement('div');
      element.className = '';
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual([]);
    });

    it('should handle whitespace-only className', () => {
      const element = document.createElement('div');
      element.className = '   \n\t   ';
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual([]);
    });

    it('should normalize multiple spaces in className', () => {
      const element = document.createElement('div');
      element.className = '  class1    class2  \n  class3\t  ';
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual(['class1', 'class2', 'class3']);
    });

    it('should handle classList when available', () => {
      const element = document.createElement('div');
      element.classList.add('class1', 'class2', 'class3');
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual(['class1', 'class2', 'class3']);
    });

    it('should handle empty classList', () => {
      const element = document.createElement('div');
      // classList exists but is empty
      
      const result = DOMSafetyUtils.getElementClasses(element);
      expect(result).toEqual([]);
    });

    it('should handle DOMTokenList toString() method', () => {
      const mockElement = {
        tagName: 'DIV',
        classList: null,
        className: {
          toString: () => 'class1 class2'
        }
      } as any;
      
      const result = DOMSafetyUtils.getElementClasses(mockElement);
      expect(result).toEqual(['class1', 'class2']);
    });

    it('should handle SVG elements with baseVal', () => {
      const mockSVGElement = {
        tagName: 'SVG',
        classList: { length: 0 }, // Empty classList to trigger fallback
        className: {
          toString: () => '[object SVGAnimatedString]',
          baseVal: 'svg-class1 svg-class2'
        }
      } as any;
      
      const result = DOMSafetyUtils.getElementClasses(mockSVGElement);
      expect(result).toEqual(['svg-class1', 'svg-class2']);
    });

    it('should handle malformed className gracefully', () => {
      const malformedCases = [
        { tagName: 'DIV', className: null, classList: null },
        { tagName: 'DIV', className: undefined, classList: null },
        { tagName: 'DIV', className: 123, classList: null },
        { tagName: 'DIV', className: {}, classList: null },
      ];

      malformedCases.forEach((testCase) => {
        const result = DOMSafetyUtils.getElementClasses(testCase as any);
        expect(result).toEqual([]);
      });
    });

    it('should handle exceptions during className processing', () => {
      const throwingElement = {
        tagName: 'DIV',
        get className() {
          throw new Error('className access failed');
        },
        get classList() {
          throw new Error('classList access failed');
        }
      } as any;

      const result = DOMSafetyUtils.getElementClasses(throwingElement);
      expect(result).toEqual([]);
    });
  });

  describe('getElementText', () => {
    it('should handle null element', () => {
      const result = DOMSafetyUtils.getElementText(null);
      expect(result).toBe('');
    });

    it('should extract textContent when available', () => {
      const element = document.createElement('div');
      element.textContent = 'Hello World';
      
      const result = DOMSafetyUtils.getElementText(element);
      expect(result).toBe('Hello World');
    });

    it('should fall back to innerText when textContent is null', () => {
      const mockElement = {
        tagName: 'DIV',
        textContent: null,
        innerText: 'Inner text content'
      } as any;
      
      const result = DOMSafetyUtils.getElementText(mockElement);
      expect(result).toBe('Inner text content');
    });

    it('should normalize whitespace in text content', () => {
      const element = document.createElement('div');
      element.textContent = '  Hello\n\n  World\t\t  ';
      
      const result = DOMSafetyUtils.getElementText(element);
      expect(result).toBe('Hello World');
    });

    it('should truncate long text content', () => {
      const element = document.createElement('div');
      element.textContent = 'A'.repeat(300);
      
      const result = DOMSafetyUtils.getElementText(element, 50);
      expect(result).toBe('A'.repeat(50) + '...');
    });

    it('should handle exceptions during text extraction', () => {
      const throwingElement = {
        tagName: 'DIV',
        get textContent() {
          throw new Error('textContent access failed');
        },
        get innerText() {
          throw new Error('innerText access failed');
        }
      } as any;

      const result = DOMSafetyUtils.getElementText(throwingElement);
      expect(result).toBe('');
    });
  });

  describe('getElementAttribute', () => {
    it('should handle null element', () => {
      const result = DOMSafetyUtils.getElementAttribute(null, 'id');
      expect(result).toBeNull();
    });

    it('should handle empty attribute name', () => {
      const element = document.createElement('div');
      const result = DOMSafetyUtils.getElementAttribute(element, '');
      expect(result).toBeNull();
    });

    it('should retrieve valid attributes', () => {
      const element = document.createElement('div');
      element.setAttribute('data-test', 'test-value');
      
      const result = DOMSafetyUtils.getElementAttribute(element, 'data-test');
      expect(result).toBe('test-value');
    });

    it('should sanitize potentially dangerous attributes', () => {
      const element = document.createElement('div');
      element.setAttribute('onclick', 'javascript:alert("xss")');
      
      const result = DOMSafetyUtils.getElementAttribute(element, 'onclick');
      expect(result).toBe('alert("xss")'); // javascript: removed
    });

    it('should remove script tags from attributes', () => {
      const element = document.createElement('div');
      element.setAttribute('data-content', '<script>alert("xss")</script>safe content');
      
      const result = DOMSafetyUtils.getElementAttribute(element, 'data-content');
      expect(result).toBe('safe content');
    });

    it('should handle getAttribute exceptions', () => {
      const throwingElement = {
        tagName: 'DIV',
        getAttribute: () => {
          throw new Error('getAttribute failed');
        }
      } as any;

      const result = DOMSafetyUtils.getElementAttribute(throwingElement, 'id');
      expect(result).toBeNull();
    });
  });

  describe('generateSafeSelector', () => {
    it('should handle null element', () => {
      const result = DOMSafetyUtils.generateSafeSelector(null);
      expect(result).toBe('');
    });

    it('should prioritize ID when available', () => {
      const element = document.createElement('div');
      element.id = 'test-id';
      element.className = 'class1 class2';
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('#test-id');
    });

    it('should use classes when ID is not available', () => {
      const element = document.createElement('div');
      element.className = 'class1 class2';
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('div.class1.class2');
    });

    it('should fall back to tag name when no ID or classes', () => {
      const element = document.createElement('span');
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('span');
    });

    it('should handle invalid CSS identifiers by falling back', () => {
      const element = document.createElement('div');
      element.id = 'test@id#special'; // Invalid CSS identifier
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      // Should fall back to tag name since ID is invalid
      expect(result).toBe('div');
    });

    it('should handle invalid CSS identifiers', () => {
      const element = document.createElement('div');
      element.className = '123invalid-class !@#$%';
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('div'); // Falls back to tag name
    });

    it('should handle exceptions during selector generation', () => {
      const throwingElement = {
        get tagName() {
          throw new Error('tagName access failed');
        }
      } as any;

      const result = DOMSafetyUtils.generateSafeSelector(throwingElement);
      expect(result).toBe('unknown-element');
    });
  });

  describe('setElementStyles', () => {
    it('should handle null element', () => {
      const result = DOMSafetyUtils.setElementStyles(null, { color: 'red' });
      expect(result).toBe(false);
    });

    it('should handle null styles', () => {
      const element = document.createElement('div');
      const result = DOMSafetyUtils.setElementStyles(element, null as any);
      expect(result).toBe(false);
    });

    it('should set valid CSS styles', () => {
      const element = document.createElement('div');
      testContainer.appendChild(element);
      
      const result = DOMSafetyUtils.setElementStyles(element, {
        color: 'red',
        backgroundColor: 'blue',
        fontSize: '16px'
      } as any);
      
      expect(result).toBe(true);
      expect(element.style.color).toBe('red');
      expect(element.style.backgroundColor).toBe('blue');
      expect(element.style.fontSize).toBe('16px');
    });

    it('should skip undefined and null style values', () => {
      const element = document.createElement('div');
      testContainer.appendChild(element);
      
      const result = DOMSafetyUtils.setElementStyles(element, {
        color: 'red',
        backgroundColor: undefined,
        fontSize: null
      } as any);
      
      expect(result).toBe(true);
      expect(element.style.color).toBe('red');
      expect(element.style.backgroundColor).toBe('');
      expect(element.style.fontSize).toBe('');
    });

    it('should handle exceptions during style setting', () => {
      const throwingElement = {
        tagName: 'DIV',
        style: {
          setProperty: () => {
            throw new Error('setProperty failed');
          }
        }
      } as any;

      const result = DOMSafetyUtils.setElementStyles(throwingElement, { color: 'red' } as any);
      expect(result).toBe(false);
    });
  });

  describe('getElementVisibility', () => {
    it('should handle null element', () => {
      const result = DOMSafetyUtils.getElementVisibility(null);
      expect(result).toEqual({
        isVisible: false,
        isInViewport: false
      });
    });

    it('should detect visible elements', () => {
      const element = document.createElement('div');
      element.style.width = '100px';
      element.style.height = '100px';
      element.style.position = 'absolute';
      element.style.top = '0px';
      element.style.left = '0px';
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      testContainer.appendChild(element);
      
      // Force layout calculation
      element.offsetHeight;
      
      const result = DOMSafetyUtils.getElementVisibility(element);
      expect(result.isVisible).toBe(true);
      expect(result.bounds).toBeDefined();
    });

    it('should detect hidden elements', () => {
      const element = document.createElement('div');
      element.style.display = 'none';
      testContainer.appendChild(element);
      
      const result = DOMSafetyUtils.getElementVisibility(element);
      expect(result.isVisible).toBe(false);
    });

    it('should handle getBoundingClientRect exceptions', () => {
      const throwingElement = {
        tagName: 'DIV',
        getBoundingClientRect: () => {
          throw new Error('getBoundingClientRect failed');
        }
      } as any;

      const result = DOMSafetyUtils.getElementVisibility(throwingElement);
      expect(result).toEqual({
        isVisible: false,
        isInViewport: false
      });
    });
  });

  describe('CSS.escape fallback', () => {
    it('should use CSS.escape when available', () => {
      // Mock CSS.escape as available
      (global as any).CSS = { escape: vi.fn().mockReturnValue('escaped') };
      
      const element = document.createElement('div');
      element.id = 'test-id';
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('#escaped');
      
      // Cleanup
      delete (global as any).CSS;
    });

    it('should fall back when CSS.escape unavailable and ID invalid', () => {
      // Ensure CSS.escape is not available
      delete (global as any).CSS;
      
      const element = document.createElement('div');
      element.id = 'test@id'; // Invalid CSS identifier
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('div'); // Should fall back to tag name
    });
  });

  describe('Edge cases and browser compatibility', () => {
    it('should handle elements without parentElement', () => {
      const element = document.createElement('div');
      // Don't append to any parent
      
      const result = DOMSafetyUtils.generateSafeSelector(element);
      expect(result).toBe('div'); // Should still work
    });

    it('should handle elements with complex nesting', () => {
      const parent = document.createElement('div');
      const child1 = document.createElement('span');
      const child2 = document.createElement('span');
      const child3 = document.createElement('span');
      
      parent.appendChild(child1);
      parent.appendChild(child2);
      parent.appendChild(child3);
      testContainer.appendChild(parent);
      
      const result = DOMSafetyUtils.generateSafeSelector(child2);
      expect(result).toBe('span:nth-child(2)');
    });

    it('should handle very long class names', () => {
      const element = document.createElement('div');
      const longClassName = 'a'.repeat(1000);
      element.className = longClassName;
      
      const classes = DOMSafetyUtils.getElementClasses(element);
      expect(classes).toEqual([longClassName]);
    });

    it('should handle Unicode characters in class names', () => {
      const element = document.createElement('div');
      element.className = 'класс 测试 🚀';
      
      const classes = DOMSafetyUtils.getElementClasses(element);
      expect(classes).toEqual(['класс', '测试', '🚀']);
    });
  });
});