// components/homepage/ui/apple-cards-carousel.tsx

"use client";
import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { AnimatePresence, motion } from "framer-motion";
import Spline from "@splinetool/react-spline";
import { useOutsideClick } from "../../../hooks/use-outside-click";

// Simple classnames util (use your own cn if you have one)
function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface CarouselProps {
  items: JSX.Element[];
  initialScroll?: number;
}

type CardT = {
  src: string;
  title: string;
  category: string;
  content: React.ReactNode;
};

export const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Spline integration refs
  const splineWrapRef = useRef<HTMLDivElement | null>(null);
  const splineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll]);

  const checkScrollability = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleCardClose = (index: number) => setCurrentIndex(index);

  // ===== Adjust this to move the cards up/down under the robot =====
  // smaller negative on mobile, larger on desktop
  const CARD_BELT_LIFT =
      "mt-[-31vh] sm:mt-[-41vh] md:mt-[-51vh] lg:mt-[-58vh] xl:mt-[-61vh]";
  // =================================================================

  return (
    <CarouselContext.Provider
      value={{ onCardClose: handleCardClose, currentIndex }}
    >
      {/* SECTION: full-height; Spline stays fixed within this area only */}
      <section className="relative w-full min-h-screen overflow-hidden bg-black">
        {/* Sticky Spline background (fixed inside this section) */}
        <div
          ref={splineWrapRef}
          className="pointer-events-none sticky top-0 h-screen w-full z-0"
          aria-hidden="true"
        >
          <Spline
            scene="https://prod.spline.design/AuduD0XZTfIdAHol/scene.splinecode"
            onLoad={() => {
              if (!splineWrapRef.current) return;
              const canvas = splineWrapRef.current.querySelector("canvas");
              if (canvas instanceof HTMLCanvasElement) {
                splineCanvasRef.current = canvas;
                // Wrapper stays pointer-events none so cards are always clickable.
                // We still allow programmatic events to hit the canvas:
                canvas.style.pointerEvents = "auto";
                // Ensure canvas fills the sticky area
                canvas.style.width = "100%";
                canvas.style.height = "100%";
                canvas.style.display = "block";
              }
            }}
          />
        </div>

        {/* Foreground content */}
        <div className="relative z-10 w-full h-full">
          {/* Horizontal carousel (original behavior retained) */}
          <div
            className={cn(
              // ↓↓↓ This negative margin lifts the whole belt into the chest→legs zone
              CARD_BELT_LIFT,
              "relative flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-20 scroll-smooth [scrollbar-width:none]"
            )}
            ref={carouselRef}
            onScroll={checkScrollability}
            onMouseMove={(e) => {
              // Proxy mousemove so Spline's mouse animations work under cards
              if (!splineCanvasRef.current) return;
              const evt = new MouseEvent("mousemove", {
                bubbles: true,
                cancelable: true,
                clientX: e.clientX,
                clientY: e.clientY,
                screenX: e.screenX,
                screenY: e.screenY,
              });
              splineCanvasRef.current.dispatchEvent(evt);
            }}
          >
            {/* Right fade edge (kept) */}
            <div
              className={cn(
                "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l"
              )}
            />

            {/* Cards track */}
            <div className={cn("flex flex-row justify-start gap-4 pl-4", "mx-auto")}>
              {items.map((item, index) => (
                <motion.div
                  key={"card" + index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.5,
                      delay: 0.2 * index,
                      ease: "easeOut",
                      once: true,
                    },
                  }}
                  className="last:pr-[5%] md:last:pr-[33%] rounded-3xl relative z-10"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-end gap-2 mr-10 pb-6">
            <button
              className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
            >
              <ArrowLeftOutlined className="pl-1 h-6 w-6 text-gray-500" />
            </button>
            <button
              className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
              onClick={scrollRight}
              disabled={!canScrollRight}
            >
              <ArrowRightOutlined className="pl-1 h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Optional bottom fade to blend with next sections */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent z-10" />
      </section>
    </CarouselContext.Provider>
  );
};

export const Card = ({
  card,
  index,
  layout = false,
}: {
  card: CardT;
  index: number;
  layout?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    document.body.style.overflow = open ? "hidden" : "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useOutsideClick(containerRef, () => handleClose());

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    onCardClose(index);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 h-screen z-50 overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-black/80 backdrop-blur-lg h-full w-full fixed inset-0"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={containerRef}
              layoutId={layout ? `card-${card.title}` : undefined}
              className="max-w-7xl mx-auto bg-white dark:bg-neutral-900 h-fit z-[60] my-2 p-4 md:p-4 rounded-3xl font-poppins relative"
            >
              <button
                className="sticky top-4 h-8 w-8 right-0 ml-auto bg-black dark:bg-white rounded-full flex items-center justify-center"
                onClick={handleClose}
              >
                <CloseOutlined className="ml-2 mr-1 h-6 w-6 text-neutral-100 dark:text-neutral-900" />
              </button>
              <motion.p
                layoutId={layout ? `category-${card.title}` : undefined}
                className="text-base font-medium text-black dark:text-white"
              >
                {card.category}
              </motion.p>
              <motion.p
                layoutId={layout ? `title-${card.title}` : undefined}
                className="text-2xl md:text-5xl font-semibold text-neutral-700 mt-4 dark:text-white font-poppins"
              >
                {card.title}
              </motion.p>
              <div className="py-10">{card.content}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        layoutId={layout ? `card-${card.title}` : undefined}
        onClick={handleOpen}
        className="rounded-3xl bg-gray-100 dark:bg-neutral-900 h-80 w-56 md:h-[25rem] md:w-80 overflow-hidden flex flex-col items-start justify-start relative z-10 transform transition-transform duration-300 hover:scale-105"
      >
        <div className="absolute h-full top-0 inset-x-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-30 pointer-events-none" />
        <div className="relative z-40 p-8">
          <motion.p
            layoutId={layout ? `category-${card.category}` : undefined}
            className="text-white text-sm md:text-base font-medium font-poppins text-left"
          >
            {card.category}
          </motion.p>
          <motion.p
            layoutId={layout ? `title-${card.title}` : undefined}
            className="text-white text-xl md:text-3xl font-semibold max-w-xs text-left [text-wrap:balance] font-poppins mt-2"
          >
            {card.title}
          </motion.p>
        </div>
        <BlurImage
          src={card.src}
          alt={card.title}
          className="object-cover absolute z-10 inset-0"
        />
      </motion.button>
    </>
  );
};

export const BlurImage = ({
  height,
  width,
  src,
  className,
  alt,
  ...rest
}: {
  height?: number;
  width?: number;
  src: string;
  className?: string;
  alt?: string;
}) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <img
      className={`${className} transition duration-300 ${
        isLoading ? "blur-sm" : "blur-0"
      }`}
      onLoad={() => setLoading(false)}
      src={src}
      width={width}
      height={height}
      loading="lazy"
      alt={alt || "Background"}
      {...rest}
    />
  );
};



//  without robot (do not delete it)
// "use client";
// import React, {
//   useEffect,
//   useRef,
//   useState,
//   createContext,
//   useContext,
// } from "react";
// import {
//   ArrowLeftOutlined,
//   ArrowRightOutlined,
//   CloseOutlined,
// } from "@ant-design/icons";
// import { cn } from "../../../lib/utils";
// import { AnimatePresence, motion } from "framer-motion";
// import { useOutsideClick } from "../../../hooks/use-outside-click";

// interface CarouselProps {
//   items: JSX.Element[];
//   initialScroll?: number;
// }

// type Card = {
//   src: string;
//   title: string;
//   category: string;
//   content: React.ReactNode;
// };

// export const CarouselContext = createContext<{
//   onCardClose: (index: number) => void;
//   currentIndex: number;
// }>( {
//   onCardClose: () => {},
//   currentIndex: 0,
// });

// export const Carousel = ({ items, initialScroll = 0 }: CarouselProps) => {
//   const carouselRef = useRef<HTMLDivElement>(null);
//   const [canScrollLeft, setCanScrollLeft] = useState(false);
//   const [canScrollRight, setCanScrollRight] = useState(true);
//   const [currentIndex, setCurrentIndex] = useState(0);

//   useEffect(() => {
//     if (carouselRef.current) {
//       carouselRef.current.scrollLeft = initialScroll;
//       checkScrollability();
//     }
//   }, [initialScroll]);

//   const checkScrollability = () => {
//     if (carouselRef.current) {
//       const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
//       setCanScrollLeft(scrollLeft > 0);
//       setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
//     }
//   };

//   const scrollLeft = () => {
//     if (carouselRef.current) {
//       carouselRef.current.scrollBy({ left: -300, behavior: "smooth" });
//     }
//   };

//   const scrollRight = () => {
//     if (carouselRef.current) {
//       carouselRef.current.scrollBy({ left: 300, behavior: "smooth" });
//     }
//   };

//   const handleCardClose = (index: number) => {
//     setCurrentIndex(index);
//   };

//   return (
//     <CarouselContext.Provider
//       value={{ onCardClose: handleCardClose, currentIndex }}
//     >
//       <div className="relative w-full">
//         <div
//           className="flex w-full overflow-x-scroll overscroll-x-auto py-10 md:py-20 scroll-smooth [scrollbar-width:none]"
//           ref={carouselRef}
//           onScroll={checkScrollability}
//         >
//           <div
//             className={cn(
//               "absolute right-0 z-[1000] h-auto w-[5%] overflow-hidden bg-gradient-to-l"
//             )}
//           ></div>

//           <div
//             className={cn(
//               "flex flex-row justify-start gap-4 pl-4 ",
//               " mx-auto"
//             )}
//           >
//             {items.map((item, index) => (
//               <motion.div
//                 initial={{
//                   opacity: 0,
//                   y: 20,
//                 }}
//                 animate={{
//                   opacity: 1,
//                   y: 0,
//                   transition: {
//                     duration: 0.5,
//                     delay: 0.2 * index,
//                     ease: "easeOut",
//                     once: true,
//                   },
//                 }}
//                 key={"card" + index}
//                 className="last:pr-[5%] md:last:pr-[33%] rounded-3xl"
//               >
//                 {item}
//               </motion.div>
//             ))}
//           </div>
//         </div>
//         <div className="flex justify-end gap-2 mr-10">
//           <button
//             className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
//             onClick={scrollLeft}
//             disabled={!canScrollLeft}
//           >
//             <ArrowLeftOutlined className="pl-1 h-6 w-6 text-gray-500" />
//           </button>
//           <button
//             className="relative z-40 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center disabled:opacity-50"
//             onClick={scrollRight}
//             disabled={!canScrollRight}
//           >
//             <ArrowRightOutlined className="pl-1 h-6 w-6 text-gray-500" />
//           </button>
//         </div>
//       </div>
//     </CarouselContext.Provider>
//   );
// };

// export const Card = ({
//   card,
//   index,
//   layout = false,
// }: {
//   card: Card;
//   index: number;
//   layout?: boolean;
// }) => {
//   const [open, setOpen] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const { onCardClose } = useContext(CarouselContext);

//   useEffect(() => {
//     function onKeyDown(event: KeyboardEvent) {
//       if (event.key === "Escape") {
//         handleClose();
//       }
//     }

//     if (open) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "auto";
//     }

//     window.addEventListener("keydown", onKeyDown);
//     return () => window.removeEventListener("keydown", onKeyDown);
//   }, [open]);

//   useOutsideClick(containerRef, () => handleClose());

//   const handleOpen = () => {
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     onCardClose(index);
//   };

//   return (
//     <>
//       <AnimatePresence>
//         {open && (
//           <div className="fixed inset-0 h-screen z-50 overflow-auto">
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="bg-black/80 backdrop-blur-lg h-full w-full fixed inset-0"
//             />
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               ref={containerRef}
//               layoutId={layout ? `card-${card.title}` : undefined}
//               className="max-w-7xl mx-auto bg-white dark:bg-neutral-900 h-fit  z-[60] my-2 p-4 md:p-4 rounded-3xl font-poppins relative"
//             >
//               <button
//                 className="sticky top-4 h-8 w-8 right-0 ml-auto bg-black dark:bg-white rounded-full flex items-center justify-center"
//                 onClick={handleClose}
//               >
//                 <CloseOutlined className="ml-2 mr-1 h-6 w-6 text-neutral-100 dark:text-neutral-900" />
//               </button>
//               <motion.p
//                 layoutId={layout ? `category-${card.title}` : undefined}
//                 className="text-base font-medium text-black dark:text-white"
//               >
//                 {card.category}
//               </motion.p>
//               <motion.p
//                 layoutId={layout ? `title-${card.title}` : undefined}
//                 className="text-2xl md:text-5xl font-semibold text-neutral-700 mt-4 dark:text-white font-poppins"
//               >
//                 {card.title}
//               </motion.p>
//               <div className="py-10">{card.content}</div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//       <motion.button
//         layoutId={layout ? `card-${card.title}` : undefined}
//         onClick={handleOpen}
//         className="rounded-3xl bg-gray-100 dark:bg-neutral-900 h-80 w-56 md:h-[25rem] md:w-80 overflow-hidden flex flex-col items-start justify-start relative z-10 transform transition-transform duration-300 hover:scale-105"
//       >
//         <div className="absolute h-full top-0 inset-x-0 bg-gradient-to-b from-black/50 via-transparent to-transparent z-30 pointer-events-none" />
//         <div className="relative z-40 p-8">
//           <motion.p
//             layoutId={layout ? `category-${card.category}` : undefined}
//             className="text-white text-sm md:text-base font-medium font-poppins text-left"
//           >
//             {card.category}
//           </motion.p>
//           <motion.p
//             layoutId={layout ? `title-${card.title}` : undefined}
//             className="text-white text-xl md:text-3xl font-semibold max-w-xs text-left [text-wrap:balance] font-poppins mt-2"
//           >
//             {card.title}
//           </motion.p>
//         </div>
//         <BlurImage
//           src={card.src}
//           alt={card.title}
//           className="object-cover absolute z-10 inset-0"
//         />
//       </motion.button>
//     </>
//   );
// };

// export const BlurImage = ({
//   height,
//   width,
//   src,
//   className,
//   alt,
//   ...rest
// }: {
//   height?: number;
//   width?: number;
//   src: string;
//   className?: string;
//   alt?: string;
// }) => {
//   const [isLoading, setLoading] = useState(true);

//   return (
//     <img
//       className={`${className} transition duration-300 ${isLoading ? 'blur-sm' : 'blur-0'}`}
//       onLoad={() => setLoading(false)}
//       src={src}
//       width={width}
//       height={height}
//       loading="lazy"
//       alt={alt || 'Background of a beautiful view'}
//       {...rest}
//     />
//   );
// };


// components/homepage/ui/apple-cards-carousel.tsx
