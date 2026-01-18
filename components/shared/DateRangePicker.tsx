"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(from);
  const [dateTo, setDateTo] = useState<Date | undefined>(to);

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger
          className={buttonVariants({
            variant: "outline",
            className: "justify-start text-left font-normal",
          })}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFrom ? format(dateFrom, "PP") : "From date"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={(date) => {
              setDateFrom(date);
              onSelect(date, dateTo);
            }}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          className={buttonVariants({
            variant: "outline",
            className: "justify-start text-left font-normal",
          })}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateTo ? format(dateTo, "PP") : "To date"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={(date) => {
              setDateTo(date);
              onSelect(dateFrom, date);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
