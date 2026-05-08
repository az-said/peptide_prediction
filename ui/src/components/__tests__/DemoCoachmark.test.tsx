/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { DemoCoachmark } from "../DemoCoachmark";

// react-joyride pulls the DOM in non-trivial ways. We mock it so the test
// asserts our integration contract (run + steps + onComplete) without
// exercising joyride's tour engine itself.
vi.mock("react-joyride", () => {
  const STATUS = {
    FINISHED: "finished",
    SKIPPED: "skipped",
    RUNNING: "running",
  };
  const Joyride = ({
    run,
    steps,
    onEvent,
  }: {
    run: boolean;
    steps: { target: string }[];
    onEvent: (data: { status: string }) => void;
  }) => {
    // Surface props for the test to inspect, plus a button to fake the
    // "tour finished" event.
    return (
      <div
        data-testid="joyride-mock"
        data-run={String(run)}
        data-step-count={steps.length}
      >
        <button
          data-testid="joyride-finish"
          onClick={() => onEvent({ status: STATUS.FINISHED })}
        >
          finish
        </button>
      </div>
    );
  };
  return {
    __esModule: true,
    STATUS,
    Joyride,
  };
});

vi.mock("@sentry/react", () => ({
  setTag: vi.fn(),
}));

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("DemoCoachmark", () => {
  it("renders nothing when run is false", () => {
    const { container } = render(
      <DemoCoachmark run={false} onComplete={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when run is true but no targets exist in DOM", async () => {
    const { container, findByTestId } = render(
      <DemoCoachmark run={true} onComplete={() => {}} />,
    );
    // After requestAnimationFrame fires, the filter runs and produces
    // an empty step list → component returns null.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    expect(container.querySelector("[data-testid='joyride-mock']")).toBeNull();
    // Ensure the await above used findByTestId only when needed
    void findByTestId;
  });

  it("includes only steps whose targets exist in the DOM", async () => {
    const kpi = document.createElement("div");
    kpi.id = "kpi-cards";
    document.body.appendChild(kpi);
    const setDiagram = document.createElement("div");
    setDiagram.id = "set-diagram";
    document.body.appendChild(setDiagram);

    const { findByTestId } = render(
      <DemoCoachmark run={true} onComplete={() => {}} />,
    );
    const mock = await findByTestId("joyride-mock");
    expect(mock.getAttribute("data-run")).toBe("true");
    expect(Number(mock.getAttribute("data-step-count"))).toBe(2);
  });

  it("calls onComplete when joyride reports finished status", async () => {
    const kpi = document.createElement("div");
    kpi.id = "kpi-cards";
    document.body.appendChild(kpi);

    const onComplete = vi.fn();
    const { findByTestId } = render(
      <DemoCoachmark run={true} onComplete={onComplete} />,
    );
    const finish = await findByTestId("joyride-finish");
    finish.click();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
