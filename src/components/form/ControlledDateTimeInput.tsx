import { DateInput, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledDateTimeInputProps {
  name: string;
  label?: string;
  timeLabel?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

const ControlledDateTimeInput = ({
  name,
  label,
  timeLabel,
  disabled,
  maxDate,
  minDate,
}: ControlledDateTimeInputProps) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
    setValue,
    watch,
  } = useFormContext();

  const currentValue = watch(name);

  const handleDateChange = (value: Date | string | null) => {
    if (!value) {
      setValue(name, null);
      return;
    }

    const date = typeof value === "string" ? new Date(value) : value;
    const currentDateTime = currentValue ? dayjs(currentValue) : dayjs();
    const newDateTime = dayjs(date)
      .hour(currentDateTime.hour())
      .minute(currentDateTime.minute())
      .second(currentDateTime.second());

    setValue(name, newDateTime.toISOString());
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = event.currentTarget.value;
    if (!timeValue) return;

    const timeParts = timeValue.split(":");
    const hours = Number.parseInt(timeParts[0] || "0", 10);
    const minutes = Number.parseInt(timeParts[1] || "0", 10);
    const seconds = Number.parseInt(timeParts[2] || "0", 10);

    const currentDateTime = currentValue ? dayjs(currentValue) : dayjs();
    const newDateTime = currentDateTime.hour(hours).minute(minutes).second(seconds);

    setValue(name, newDateTime.toISOString());
  };

  const dateValue = currentValue ? dayjs(currentValue).toDate() : null;
  const timeValue = currentValue ? dayjs(currentValue).format("HH:mm") : "";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Controller
          control={control}
          name={`${name}_date`}
          render={() => (
            <DateInput
              label={label}
              value={dateValue}
              onChange={handleDateChange}
              maxDate={maxDate}
              minDate={minDate}
              disabled={disabled || isLoading || isSubmitting}
              error={errors?.[name]?.message as string}
              aria-invalid={!!errors?.[name]?.message}
              aria-label={`${label} date`}
              className="flex-1"
              placeholder="Select date"
            />
          )}
        />
        <Controller
          control={control}
          name={`${name}_time`}
          render={() => (
            <TimeInput
              label={timeLabel}
              error={errors?.[name]?.message as string}
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled || isLoading || isSubmitting}
              aria-label={`${timeLabel} time`}
              aria-invalid={!!errors?.[name]?.message}
              className="flex-1"
              placeholder="Select time"
            />
          )}
        />
      </div>
    </div>
  );
};

export default ControlledDateTimeInput;
