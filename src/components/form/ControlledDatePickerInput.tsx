import { DatePickerInput, type DatePickerInputProps } from "@mantine/dates";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledDatePickerInputProps extends DatePickerInputProps<"range"> {
  name: string;
}

const ControlledDatePickerInput = ({ name, ...props }: ControlledDatePickerInputProps) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <DatePickerInput
          {...field}
          {...props}
          value={field.value}
          onChange={field.onChange}
          error={errors?.[name]?.message as string}
          aria-invalid={!!errors?.[name]?.message}
          readOnly={props.readOnly || isLoading || isSubmitting}
        />
      )}
    />
  );
};

export default ControlledDatePickerInput;
