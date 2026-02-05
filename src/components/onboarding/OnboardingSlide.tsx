 import { ReactNode } from "react";
 import { cn } from "@/lib/utils";
 
 interface OnboardingSlideProps {
   title: string;
   description?: string;
   icon?: ReactNode;
   illustration?: ReactNode;
   features?: Array<{
     icon: string;
     text: string;
   }>;
   className?: string;
 }
 
 export function OnboardingSlide({
   title,
   description,
   icon,
   illustration,
   features,
   className,
 }: OnboardingSlideProps) {
   return (
     <div className={cn("flex flex-col items-center text-center px-6 py-8", className)}>
       {/* Illustration or Icon */}
       {illustration && (
         <div className="w-64 h-64 mb-8 flex items-center justify-center">
           {illustration}
         </div>
       )}
       {icon && !illustration && (
         <div className="w-20 h-20 mb-6 bg-primary/10 rounded-full flex items-center justify-center text-primary">
           {icon}
         </div>
       )}
 
       {/* Title */}
       <h2 className="text-2xl font-bold text-foreground mb-3">{title}</h2>
 
       {/* Description */}
       {description && (
         <p className="text-muted-foreground text-base mb-6 max-w-sm">{description}</p>
       )}
 
       {/* Features List */}
       {features && features.length > 0 && (
         <div className="w-full max-w-sm space-y-4 text-left">
           {features.map((feature, index) => (
             <div
               key={index}
               className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
             >
               <span className="text-2xl flex-shrink-0">{feature.icon}</span>
               <span className="text-foreground text-sm leading-relaxed">{feature.text}</span>
             </div>
           ))}
         </div>
       )}
     </div>
   );
 }