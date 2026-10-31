 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import { Label } from "@/components/ui/label";
 import { ChevronLeft, ChevronRight } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface OnboardingCarouselProps {
   children: React.ReactNode[];
   onComplete: () => void;
   completeButtonText?: string;
   skipButtonText?: string;
   showSkip?: boolean;
   showDismissOption?: boolean;
   dismissLabel?: string;
   onDismiss?: () => void;
 }
 
 export function OnboardingCarousel({
   children,
   onComplete,
   completeButtonText = "Inizia",
   skipButtonText = "Salta",
   showSkip = true,
   showDismissOption = false,
   dismissLabel = "Non mostrare più",
   onDismiss,
 }: OnboardingCarouselProps) {
   const [currentIndex, setCurrentIndex] = useState(0);
   const [dismissChecked, setDismissChecked] = useState(false);
   const totalSlides = children.length;
   const isLastSlide = currentIndex === totalSlides - 1;
 
   const finish = () => {
     if (dismissChecked && onDismiss) {
       onDismiss();
     }
     onComplete();
   };
 
   const goToNext = () => {
     if (isLastSlide) {
       finish();
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
    <div className="flex flex-col h-full min-h-0">
      {/* Skip button */}
      {showSkip && (
        <div className="flex justify-end p-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={finish}>
            {skipButtonText}
          </Button>
        </div>
      )}

      {/* Slides container */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
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

      {/* Navigation - always visible at bottom */}
      <div className="p-6 space-y-4 flex-shrink-0 bg-background border-t border-border/20 safe-area-pb">
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
 
         {showDismissOption && (
           <div className="flex items-center justify-center gap-2">
             <Checkbox
               id="dismiss-onboarding"
               checked={dismissChecked}
               onCheckedChange={(checked) => setDismissChecked(checked === true)}
             />
             <Label
               htmlFor="dismiss-onboarding"
               className="text-sm text-muted-foreground cursor-pointer"
             >
               {dismissLabel}
             </Label>
           </div>
         )}

         {/* Navigation buttons */}
         <div className="flex gap-3">
           {currentIndex > 0 && (
             <Button variant="outline" onClick={goToPrev} className="flex-1" aria-label="Indietro">
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