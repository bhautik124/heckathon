import gsap from "gsap";
import CustomEase from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
CustomEase.create(
  "hop",
  "M0,0 C0.488,0.02 0.467,0.286 0.5,0.5 0.532,0.712 0.58,1 1,1"
);

export const initSliderAnimations = (elements, content) => {
  const {
    slider,
    sliderTitle,
    sliderItems,
    sliderPreview,
    initialSlideIndex = 0,
  } = elements;

  const totalSlides = content.length;
  let activeSlideIndex = initialSlideIndex + 1; 
  let isAnimating = false;

  const clipPath = {
    closed: "polygon(25% 30%, 75% 30%, 75% 70%, 25% 70%)",
    open: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  };

  const slidePositions = {
    prev: { left: "15%", rotation: -90 },
    active: { left: "50%", rotation: 0 },
    next: { left: "85%", rotation: 90 },
  };

  const splitTextIntoSpans = (element) => {
    element.innerHTML = element.innerText
      .split("")
      .map((char) => `<span>${char === " " ? "&nbsp;&nbsp;" : char}</span>`)
      .join("");
  };

  const createAndAnimateTitle = (content, direction) => {
    const newTitle = document.createElement("h1");
    newTitle.innerText = content.name;
    sliderTitle.appendChild(newTitle);
    splitTextIntoSpans(newTitle);

    const yOffset = direction === "next" ? 60 : -60;
    gsap.set(newTitle.querySelectorAll("span"), { y: yOffset });
    gsap.to(newTitle.querySelectorAll("span"), {
      y: 0,
      duration: 1.25,
      stagger: 0.02,
      ease: "hop",
      delay: 0.25,
    });

    const currentTitle = sliderTitle.querySelector("h1:not(:last-child)");
    if (currentTitle) {
      gsap.to(currentTitle.querySelectorAll("span"), {
        y: -yOffset,
        duration: 1.25,
        stagger: 0.02,
        ease: "hop",
        delay: 0.25,
        onComplete: () => currentTitle.remove(),
      });
    }
  };

  const createSlide = (content, className) => {
    const slide = document.createElement("div");
    slide.className = `slide-container ${className}`;
    slide.innerHTML = `<div class="slide-img"><img src="${content.img}" alt="${content.name}"></div>`;
    return slide;
  };

  const getSlideIndex = (increment) => {
    return ((activeSlideIndex + increment - 1 + totalSlides) % totalSlides) + 1;
  };

  const updatePreviewImage = (content) => {
    const newImage = document.createElement("img");
    newImage.src = content.img;
    newImage.alt = content.name;
    sliderPreview.appendChild(newImage);

    gsap.fromTo(
      newImage,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: "power2.inOut",
        delay: 0.5,
        onComplete: () =>
          sliderPreview.querySelector("img:not(:last-child)")?.remove(),
      }
    );
  };

  const animateSlide = (slide, props) => {
    gsap.to(slide, { ...props, duration: 2, ease: "hop" });
    gsap.to(slide.querySelector(".slide-img"), {
      rotation: -props.rotation,
      duration: 2,
      ease: "hop",
    });
  };

  const transitionSlides = (direction) => {
    if (isAnimating) return;
    isAnimating = true;

    const [outgoingPos, incomingPos] =
      direction === "next" ? ["prev", "next"] : ["next", "prev"];

    const outgoingSlide = slider.querySelector(`.${outgoingPos}`);
    const activeSlide = slider.querySelector(".active");
    const incomingSlide = slider.querySelector(`.${incomingPos}`);

    animateSlide(incomingSlide, {
      ...slidePositions.active,
      clipPath: clipPath.open,
    });

    animateSlide(activeSlide, {
      ...slidePositions[outgoingPos],
      clipPath: clipPath.closed,
    });

    gsap.to(outgoingSlide, {
      scale: 0,
      opacity: 0,
      duration: 2,
      ease: "hop",
    });

    const newSlideIndex = getSlideIndex(direction === "next" ? 2 : -2);
    const newSlide = createSlide(content[newSlideIndex - 1], incomingPos);
    slider.appendChild(newSlide);

    gsap.set(newSlide, {
      ...slidePositions[incomingPos],
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 0,
      clipPath: clipPath.closed,
    });

    gsap.to(newSlide, { scale: 1, opacity: 1, duration: 2, ease: "hop" });

    const newActiveIndex = getSlideIndex(direction === "next" ? 1 : -1);
    createAndAnimateTitle(content[newActiveIndex - 1], direction);
    updatePreviewImage(content[newActiveIndex - 1]);

    sliderItems.querySelectorAll("p").forEach((item, i) => {
      item.classList.toggle("activeItem", i === newActiveIndex - 1);
    });

    setTimeout(() => {
      outgoingSlide.remove();
      activeSlide.className = `slide-container ${outgoingPos}`;
      incomingSlide.className = "slide-container active";
      newSlide.className = `slide-container ${incomingPos}`;
      activeSlideIndex = newActiveIndex;
      isAnimating = false;
    }, 2000);
  };

  Object.entries(slidePositions).forEach(([key, value]) => {
    gsap.set(`.slide-container.${key}`, {
      ...value,
      xPercent: -50,
      yPercent: -50,
      clipPath: key === "active" ? clipPath.open : clipPath.closed,
    });

    if (key !== "active") {
      gsap.set(`.slide-container.${key} .slide-img`, {
        rotation: -value.rotation,
      });
    }
  });

  const initialTitle = sliderTitle.querySelector("h1");
  splitTextIntoSpans(initialTitle);
  gsap.fromTo(
    initialTitle.querySelectorAll("span"),
    {
      y: 60,
    },
    {
      y: 0,
      duration: 1,
      stagger: 0.02,
      ease: "hop",
    }
  );

  slider.addEventListener("click", (e) => {
    const clickedSlide = e.target.closest(".slide-container");
    if (!clickedSlide || isAnimating) return;

    if (clickedSlide.classList.contains("active")) {
      const currentLink = content[activeSlideIndex - 1].link;
      if (currentLink) window.open(currentLink, "_blank");
    } else if (clickedSlide.classList.contains("next")) {
      transitionSlides("next");
    } else if (clickedSlide.classList.contains("prev")) {
      transitionSlides("prev");
    }
  });

  sliderItems.querySelectorAll("p").forEach((item, index) => {
    item.addEventListener("click", () => {
      if (index + 1 !== activeSlideIndex && !isAnimating) {
        transitionSlides(index + 1 > activeSlideIndex ? "next" : "prev");
      }
    });
  });

  return {
    transitionSlides,
  };
};
