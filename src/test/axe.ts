import axe from "axe-core";

/** Runs axe on a container. Colour contrast is skipped: jsdom has no layout/paint. */
export async function getA11yViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations;
}
