"use client"

import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "motion/react"

import { cn } from "@/lib/utils"

const bentoGridVariants = cva(
  "relative grid gap-4 w-full",
  {
    variants: {
      variant: {
        default: `
          grid-cols-2 md:grid-cols-4
          [&>*:first-child]:col-span-2 
          [&>*]:aspect-[4/3] md:[&>*]:aspect-video
        `,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>
}
const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined)

function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext)
  if (!context) {
    throw new Error("useContainerScrollContext must be used within a ContainerScroll Component")
  }
  return context
}

const ContainerScroll = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end end"]
  })
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative w-full", className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  )
}

const BentoGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bentoGridVariants>
>(({ variant, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(bentoGridVariants({ variant }), className)}
      {...props}
    />
  )
})
BentoGrid.displayName = "BentoGrid"

const BentoCell = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, style, ...props }, ref) => {
    const { scrollYProgress } = useContainerScrollContext()
    
    const translate = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"])
    const scale = useTransform(scrollYProgress, [0, 0.8], [0.9, 1.2])

    return (
      <div className="overflow-hidden rounded-xl"> 
        <motion.div
          ref={ref}
          className={cn("w-full h-full", className)}
          style={{ scale, ...style }}
          {...props}
        />
      </div>
    )
  }
)
BentoCell.displayName = "BentoCell"

const ContainerScale = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, style, ...props }, ref) => {
    const { scrollYProgress } = useContainerScrollContext()
    
    const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
    const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8])
    const blur = useTransform(scrollYProgress, [0, 0.3], [0, 10])

    return (
      <motion.div
        ref={ref}
        className={cn("fixed left-1/2 top-1/2 size-fit", className)}
        style={{
          translate: "-50% -50%",
          scale,
          opacity,
          filter: `blur(${blur}px)`,
          ...style,
        }}
        {...props}
      />
    )
  }
)
ContainerScale.displayName = "ContainerScale"

export { ContainerScroll, BentoGrid, BentoCell, ContainerScale }