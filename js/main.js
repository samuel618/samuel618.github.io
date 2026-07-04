// Close the mobile sidebar drawer after a nav link is tapped
const sidebarToggle = document.getElementById("sidebar-toggle");

if (sidebarToggle) {
  document.querySelectorAll(".sidebar-nav a, .sidebar-social a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebarToggle.checked = false;
    });
  });
}

// Highlight the sidebar link for whichever page section is in view
const navLinks = document.querySelectorAll(".sidebar-nav a");
const trackedSections = document.querySelectorAll("main section[id], footer[id]");

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
