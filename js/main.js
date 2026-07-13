// Close the mobile sidebar drawer after a nav link is tapped
const sidebarToggle = document.getElementById("sidebar-toggle");

if (sidebarToggle) {
  document.querySelectorAll(".sidebar-nav a, .sidebar-social a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebarToggle.checked = false;
    });
  });
}

// Highlight the sidebar link for whichever page section is in view.
// Only sections whose id matches a sidebar link's hash are tracked, so
// an in-page anchor target that isn't a nav destination (e.g. a project
// detail page's #dashboard/#screenshots section) can't hijack the
// "active" state away from the Projects link.
const navLinks = document.querySelectorAll(".sidebar-nav a");
const navHashes = new Set(Array.from(navLinks).map((link) => link.getAttribute("href").split("#")[1]));
const trackedSections = Array.from(document.querySelectorAll("main section[id], footer[id]")).filter((section) =>
  navHashes.has(section.id)
);

if (navLinks.length && trackedSections.length) {
  const setActiveLink = (id) => {
    navLinks.forEach((link) => {
      const hash = link.getAttribute("href").split("#")[1];
      link.classList.toggle("active", hash === id);
    });
  };

  // A short last section (e.g. Contact) can sit below the observer's
  // detection band with no room left to scroll it up into view, so it
  // would never otherwise get marked active. This check is authoritative:
  // it's called after every observer update too, so it always has the
  // final say once the page is scrolled as far down as it goes.
  const lastSection = trackedSections[trackedSections.length - 1];
  const isAtBottom = () =>
    window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;

  const observer = new IntersectionObserver(
    (entries) => {
      if (isAtBottom()) {
        setActiveLink(lastSection.id);
        return;
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  trackedSections.forEach((section) => observer.observe(section));

  const checkAtBottom = () => {
    if (isAtBottom()) {
      setActiveLink(lastSection.id);
    }
  };

  window.addEventListener("scroll", checkAtBottom, { passive: true });
  checkAtBottom();
}

// Screenshot lightbox: click a gallery screenshot to see it full-size
const lightbox = document.getElementById("lightbox");

if (lightbox) {
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeButton = lightbox.querySelector(".lightbox-close");
  const triggers = document.querySelectorAll(".screenshot-trigger");
  let lastFocusedTrigger = null;

  const openLightbox = (trigger) => {
    const fullSrc = trigger.getAttribute("data-full-src");
    const caption = trigger.getAttribute("data-caption") || "";
    const sourceImg = trigger.querySelector("img");

    lightboxImg.src = fullSrc;
    lightboxImg.alt = sourceImg ? sourceImg.alt : caption;
    lightboxCaption.textContent = caption;

    lastFocusedTrigger = trigger;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
    }
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

// Projects carousel: shows several project cards at once (the exact
// number depends on viewport width, set in CSS breakpoints) and pages
// through them one card at a time via the prev/next arrows or dots.
// The current position is remembered in sessionStorage so following a
// project link and then clicking "Back to projects" returns to the
// same spot instead of resetting to the first card.
const carouselTrack = document.querySelector(".project-carousel-track");

if (carouselTrack) {
  const CAROUSEL_STORAGE_KEY = "projectsCarouselIndex";
  const slides = Array.from(carouselTrack.children);
  const prevBtn = document.querySelector(".carousel-arrow--prev");
  const nextBtn = document.querySelector(".carousel-arrow--next");
  const dotsContainer = document.querySelector(".carousel-dots");
  const viewport = document.querySelector(".project-carousel-viewport");

  let currentIndex = parseInt(sessionStorage.getItem(CAROUSEL_STORAGE_KEY), 10) || 0;
  let lastMaxIndex = -1;

  const getStep = () => {
    const trackGap = parseFloat(getComputedStyle(carouselTrack).columnGap) || 0;
    return slides[0].getBoundingClientRect().width + trackGap;
  };

  const getMaxIndex = (step) => {
    const visibleCount = Math.max(1, Math.round(viewport.clientWidth / step));
    return Math.max(0, slides.length - visibleCount);
  };

  const renderDots = (maxIndex) => {
    dotsContainer.innerHTML = "";
    for (let i = 0; i <= maxIndex; i += 1) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Go to project group ${i + 1}`);
      dot.addEventListener("click", () => {
        currentIndex = i;
        update();
      });
      dotsContainer.appendChild(dot);
    }
  };

  const update = () => {
    const step = getStep();
    const maxIndex = getMaxIndex(step);

    if (maxIndex !== lastMaxIndex) {
      renderDots(maxIndex);
      lastMaxIndex = maxIndex;
    }

    currentIndex = Math.min(currentIndex, maxIndex);
    carouselTrack.style.transform = `translateX(-${currentIndex * step}px)`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= maxIndex;

    Array.from(dotsContainer.children).forEach((dot, i) => {
      dot.classList.toggle("active", i === currentIndex);
    });

    sessionStorage.setItem(CAROUSEL_STORAGE_KEY, String(currentIndex));
  };

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      update();
    }
  });

  nextBtn.addEventListener("click", () => {
    const maxIndex = getMaxIndex(getStep());
    if (currentIndex < maxIndex) {
      currentIndex += 1;
      update();
    }
  });

  window.addEventListener("resize", update);
  update();
}

// Project card "See more": each card's description is clamped to a
// fixed number of lines (and the awards callout, where present, is
// hidden) so all the visible cards stay a consistent height. The
// button only appears when there's actually more to show, and only
// then does clicking it reveal the full description (and awards, if
// any).
document.querySelectorAll(".project-card").forEach((card) => {
  const desc = card.querySelector(".project-card-desc");
  const seeMoreBtn = card.querySelector(".card-see-more");
  if (!desc || !seeMoreBtn) return;

  const hasAwards = Boolean(card.querySelector(".project-card-awards"));

  const syncVisibility = () => {
    if (card.classList.contains("is-expanded")) return;
    const isTruncated = desc.scrollHeight > desc.clientHeight + 1;
    seeMoreBtn.hidden = !(isTruncated || hasAwards);
  };

  seeMoreBtn.addEventListener("click", () => {
    const expanded = card.classList.toggle("is-expanded");
    seeMoreBtn.textContent = expanded ? "See less" : "See more";
  });

  syncVisibility();
  window.addEventListener("resize", syncVisibility);
});

// Scroll-to-top button: appears after scrolling down a bit
const scrollTopBtn = document.getElementById("scroll-top-btn");

if (scrollTopBtn) {
  const toggleVisibility = () => {
    scrollTopBtn.classList.toggle("is-visible", window.scrollY > 400);
  };

  window.addEventListener("scroll", toggleVisibility, { passive: true });
  toggleVisibility();

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
