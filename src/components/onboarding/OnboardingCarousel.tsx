 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface OnboardingCarouselProps {
   children: React.ReactNode[];
   onComplete: () => void;
   completeButtonText?: string;
   skipButtonText?: string;
   showSkip?: boolean;
 }
 
 export function OnboardingCarousel({
   children,
   onComplete,
   completeButtonText = "Inizia",
   skipButtonText = "Salta",
   showSkip = true,
 }: OnboardingCarouselProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const totalSlides = children.length;
   const isLastSlide = currentIndex === totalSlides - 1;
 
   const goToNext = () => {
     if (isLastSlide) {
       onComplete();
     } else {
       setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
     }
   };
 
   const goToPrev = () => {
     setCurrentIndex((prev) => Math.max(prev - 1, 0));
   };
 
   const goToSlide = (index: number) => {
     setCurrentIndex(index);
   };
 
   return (
     <div className="flex flex-col h-full">
       {/* Skip button */}
       {showSkip && !isLastSlide && (
         <div className="flex justify-end p-4">
           <Button variant="ghost" size="sm" onClick={onComplete}>
             {skipButtonText}
           </Button>
         </div>
       )}
 
       {/* Slides container */}
       <div className="flex-1 overflow-hidden relative">
         <div
           className="flex h-full transition-transform duration-300 ease-out"
           style={{ transform: `translateX(-${currentIndex * 100}%)` }}
         >
           {children.map((child, index) => (
             <div key={index} className="w-full flex-shrink-0 h-full overflow-y-auto">
               {child}
             </div>
           ))}
         </div>
       </div>
 
       {/* Navigation */}
       <div className="p-6 space-y-4">
         {/* Dots indicator */}
         <div className="flex justify-center gap-2">
           {Array.from({ length: totalSlides }).map((_, index) => (
             <button
               key={index}
               onClick={() => goToSlide(index)}
               className={cn(
                 "w-2 h-2 rounded-full transition-all duration-200",
                 index === currentIndex
                   ? "w-6 bg-primary"
                   : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
               )}
               aria-label={`Go to slide ${index + 1}`}
             />
           ))}
         </div>
 
         {/* Navigation buttons */}
         <div className="flex gap-3">
           {currentIndex > 0 && (
             <Button variant="outline" onClick={goToPrev} className="flex-1">
               <ChevronLeft className="w-4 h-4 mr-1" />
               Indietro
             </Button>
           )}
           <Button onClick={goToNext} className={cn("flex-1", currentIndex === 0 && "w-full")}>
             {isLastSlide ? completeButtonText : "Avanti"}
             {!isLastSlide && <ChevronRight className="w-4 h-4 ml-1" />}
           </Button>
         </div>
       </div>
     </div>
   );
 }