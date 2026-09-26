// Prints a single DOM element by cloning it into a blank, isolated
// browser window instead of hiding the rest of the current page via CSS.
// The "hide everything except #target" trick (visibility:hidden + a
// pulled-out-of-flow positioned target) is fragile in practice -- we hit
// three different real bugs chasing it for the certificate print view: a
// phantom blank second page (hidden siblings keep their layout height), a
// mispositioned/clipped render (a transformed dialog ancestor hijacks
// position:fixed's containing block), and finally blank PDF output (Chromium's
// headless print-to-PDF pipeline didn't paint a plain position:absolute
// layer the same way the live DOM did). None of that can happen in a
// document that only ever contains the certificate.
export async function printElementInNewWindow(elementId: string, title = 'Print'): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) return;

  const printWindow = window.open('', '_blank', 'width=1200,height=850');
  if (!printWindow) {
    // Popup blocked -- fall back to the normal in-page print. Won't be
    // perfectly isolated, but better than doing nothing.
    window.print();
    return;
  }

  // Carries over every stylesheet the current page has (Vite's compiled
  // Tailwind bundle in prod, its injected dev <style> tags in dev, plus the
  // Google Fonts <style>/@import) so the cloned markup's classes resolve
  // identically in the new window -- no separate stylesheet to maintain.
  const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
${styleTags}
<style>
  @page { size: landscape; margin: 0; }
  html, body {
    margin: 0;
    padding: 0;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
  }
</style>
</head>
<body>${el.outerHTML}</body>
</html>`);
  printWindow.document.close();

  await new Promise<void>((resolve) => {
    if (printWindow.document.readyState === 'complete') {
      resolve();
      return;
    }
    printWindow.addEventListener('load', () => resolve(), { once: true });
  });
  // Google Fonts load async -- printing before they're ready silently falls
  // back to a system serif, which looks wrong on a typography-heavy template.
  await (printWindow.document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.catch(() => {});

  printWindow.focus();
  printWindow.print();
  printWindow.addEventListener('afterprint', () => printWindow.close());
}
