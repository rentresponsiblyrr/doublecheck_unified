/**
 * BASIC RENDERING TEST SUITE - EXTRACTED FROM GOD TEST FILE
 *
 * Professional test suite for basic rendering functionality.
 * Clean separation from massive test file for better maintainability.
 *
 * @author STR Certified Engineering Team
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { SystemStatusPanel } from "../../index";
import { ELEMENT_IDS } from "../../systemStatusConstants";

describe("SystemStatusPanel - Basic Rendering", () => {
  it("renders without crashing", async () => {
    render(<SystemStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText("System Status")).toBeInTheDocument();
    });
  });

  it("displays loading state initially", () => {
    render(<SystemStatusPanel />);

    expect(screen.getByText("Loading system metrics...")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: /loading system metrics/i }),
    ).toBeInTheDocument();
  });

  it("renders all required element IDs", async () => {
    render(<SystemStatusPanel />);

    await waitFor(() => {
      const mainCard = document.getElementById(
        ELEMENT_IDS.systemStatusMainCard,
      );
      expect(mainCard).toBeInTheDocument();
    });

    // Check other critical elements
    expect(document.getElementById("system-status-header")).toBeInTheDocument();
    expect(document.getElementById("system-status-title")).toBeInTheDocument();
    expect(document.getElementById("system-metrics-grid")).toBeInTheDocument();
  });

  it("applies custom className prop", () => {
    const testClass = "custom-test-class";
    render(<SystemStatusPanel className={testClass} />);

    const mainCard = document.getElementById(ELEMENT_IDS.systemStatusMainCard);
    expect(mainCard).toHaveClass(testClass);
  });
});
