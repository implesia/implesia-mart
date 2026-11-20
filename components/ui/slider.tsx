import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

type SliderProps = SliderPrimitive.Root.Props & {
  formatTooltip?: (value: number) => string;
  showTicks?: boolean;
  ticks?: number[];
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  formatTooltip,
  showTicks = false,
  ticks = [],
  ...props
}: SliderProps) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full relative", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none py-2.5 data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col cursor-pointer">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-neutral-200/90 select-none data-horizontal:h-2 data-horizontal:w-full data-vertical:h-full data-vertical:w-2 dark:bg-white/15"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>

        {/* Visual tick points on the track */}
        {showTicks && ticks.length > 0 ? (
          <div className="pointer-events-none absolute inset-x-0 flex items-center justify-between px-0.5">
            {ticks.map((tick) => {
              const inRange =
                _values.length >= 2
                  ? tick >= _values[0] && tick <= _values[1]
                  : tick <= (_values[0] ?? 0);
              return (
                <span
                  key={tick}
                  style={{
                    left: `${((tick - min) / (max - min)) * 100}%`,
                    position: "absolute",
                    transform: "translateX(-50%)",
                  }}
                  className={cn(
                    "size-2 rounded-full border border-white transition-colors z-[1]",
                    inRange
                      ? "bg-primary shadow-xs ring-1 ring-primary/30"
                      : "bg-neutral-300 dark:bg-neutral-600"
                  )}
                />
              );
            })}
          </div>
        ) : null}

        {Array.from({ length: _values.length }, (_, index) => {
          const val = _values[index];
          const tooltipText = formatTooltip
            ? formatTooltip(val)
            : val?.toLocaleString();

          return (
            <SliderPrimitive.Thumb
              data-slot="slider-thumb"
              index={index}
              key={index}
              getAriaLabel={() =>
                index === 0 ? "Minimum price" : "Maximum price"
              }
              className="group relative flex size-5.5 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-white shadow-md shadow-primary/20 ring-primary/25 select-none transition-all hover:scale-115 hover:ring-4 focus-visible:scale-115 focus-visible:ring-4 focus-visible:outline-hidden active:scale-115 active:ring-4 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
            >
              {/* Inner point dot */}
              <span className="size-2 rounded-full bg-primary transition-transform group-hover:scale-110" />

              {/* Floating point value tooltip */}
              {tooltipText ? (
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded-lg bg-neutral-900 px-2 py-0.5 text-[10.5px] font-bold text-white shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 group-data-[dragging]:opacity-100 transition-opacity dark:bg-white dark:text-neutral-900 z-30">
                  {tooltipText}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-neutral-900 dark:border-t-white" />
                </span>
              ) : null}
            </SliderPrimitive.Thumb>
          );
        })}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
