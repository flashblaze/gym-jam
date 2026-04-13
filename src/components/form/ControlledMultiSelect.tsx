import { MultiSelect, type MultiSelectProps } from "@mantine/core";
import { Controller, useFormContext } from "react-hook-form";

interface ControlledMultiSelectProps extends MultiSelectProps {
  name: string;
}

const ControlledMultiSelect = ({ name, ...props }: ControlledMultiSelectProps) => {
  const {
    control,
    formState: { errors, isLoading, isSubmitting },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MultiSelect
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

export default ControlledMultiSelect;
