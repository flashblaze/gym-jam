import { DateTimePicker, type DateTimePickerProps } from "@mantine/dates";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledDateTimePickerProps extends DateTimePickerProps {
  name: string;
}

const ControlledDateTimePicker = ({ name, ...props }: ControlledDateTimePickerProps) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DateTimePicker
          {...field}
          {...props}
          error={errors?.[name]?.message as string}
          aria-invalid={!!errors?.[name]?.message}
          readOnly={props.readOnly || isLoading || isSubmitting}
        />
      )}
    />
  );
};

export default ControlledDateTimePicker;
