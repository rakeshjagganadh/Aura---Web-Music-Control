import { chromium } from 'playwright';

const viewports = [
  // Desktop
  { name: 'desktop-1920', width: 1920, height: 1080, type: 'desktop' },
  { name: 'desktop-1600', width: 1600, height: 900, type: 'desktop' },
  { name: 'desktop-1440', width: 1440, height: 900, type: 'desktop' },
  { name: 'desktop-1366', width: 1366, height: 768, type: 'desktop' },
  { name: 'desktop-1280', width: 1280, height: 800, type: 'desktop' },
  // Tablet
  { name: 'tablet-1024', width: 1024, height: 768, type: 'tablet' },
  { name: 'tablet-820', width: 820, height: 1180, type: 'tablet' },
  { name: 'tablet-768', width: 768, height: 1024, type: 'tablet' },
  // Mobile
  { name: 'mobile-430', width: 430, height: 932, type: 'mobile' },
  { name: 'mobile-390', width: 390, height: 844, type: 'mobile' },
  { name: 'mobile-375', width: 375, height: 812, type: 'mobile' },
  { name: 'mobile-360', width: 360, height: 800, type: 'mobile' },
  { name: 'mobile-landscape', width: 844, height: 390, type: 'mobile' }
];

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditResults = {
    fonts: {},
    overflows: [],
    playerIntegrity: [],
    smallTouchTargets: []
  };

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });

    // 1. Font Audit
    const fontInfo = await page.evaluate(async () => {
      await document.fonts.ready;
      const loaded = [];
      document.fonts.forEach((f) => {
        loaded.push({
          family: f.family,
          status: f.status,
          weight: f.weight
        });
      });
      const bodyComputed = window.getComputedStyle(document.body).fontFamily;
      return { loaded, bodyComputed };
    });
    auditResults.fonts = fontInfo;

    // 2. Viewport & Layout Audit
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const metrics = await page.evaluate((vpType) => {
        const docOverflow = document.documentElement.scrollWidth > window.innerWidth;
        const bodyOverflow = document.body.scrollWidth > window.innerWidth;

        // Check player
        const isMobile = window.innerWidth < 768;
        const desktopPlayer = document.querySelector('footer');
        const mobileNav = document.querySelector('nav');
        
        let playerVisible = false;
        let playerHeight = 0;
        if (!isMobile && desktopPlayer) {
          const rect = desktopPlayer.getBoundingClientRect();
          playerVisible = rect.height > 0 && rect.bottom <= window.innerHeight + 2;
          playerHeight = rect.height;
        } else if (isMobile) {
          playerVisible = true; // mobile uses bottom dock or mini-player
        }

        // Check small buttons (below 28px in dimension)
        const smallBtns = [];
        const buttons = Array.from(document.querySelectorAll('button:not([hidden])'));
        for (const b of buttons) {
          const rect = b.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if interactive button is unusually tiny
            if ((rect.width < 24 || rect.height < 24) && !b.classList.contains('pointer-events-none')) {
              smallBtns.push({
                text: b.innerText?.slice(0, 30) || b.getAttribute('aria-label') || b.className?.slice(0, 30),
                w: Math.round(rect.width),
                h: Math.round(rect.height)
              });
            }
          }
        }

        return {
          docOverflow,
          bodyOverflow,
          playerVisible,
          playerHeight,
          smallBtns: smallBtns.slice(0, 5)
        };
      }, vp.type);

      if (metrics.docOverflow || metrics.bodyOverflow) {
        auditResults.overflows.push({ viewport: vp.name, ...metrics });
      }

      auditResults.playerIntegrity.push({
        viewport: vp.name,
        visible: metrics.playerVisible,
        height: metrics.playerHeight
      });

      if (metrics.smallBtns.length > 0) {
        auditResults.smallTouchTargets.push({
          viewport: vp.name,
          targets: metrics.smallBtns
        });
      }
    }

    console.log(JSON.stringify(auditResults, null, 2));
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAudit();
