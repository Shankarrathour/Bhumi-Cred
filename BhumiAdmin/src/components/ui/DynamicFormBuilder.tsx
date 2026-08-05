import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button, Grid, MenuItem, Select, InputLabel, FormControl, FormHelperText, CircularProgress } from '@mui/material';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'select' | 'password' | 'date';
  required?: boolean;
  options?: { label: string; value: string | number }[]; // For select fields
  gridProps?: { xs?: number; sm?: number; md?: number };
}

interface DynamicFormBuilderProps {
  fields: FormField[];
  defaultValues?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export const DynamicFormBuilder: React.FC<DynamicFormBuilderProps> = ({
  fields,
  defaultValues = {},
  onSubmit,
  isLoading = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel
}) => {
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Grid container spacing={3}>
        {fields.map((field) => (
          <Grid size={{ xs: 12, sm: field.gridProps?.sm || 12, md: field.gridProps?.md || 12 }} key={field.name}>
            <Controller
              name={field.name}
              control={control}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: controllerField }) => {
                
                if (field.type === 'select') {
                  return (
                    <FormControl fullWidth error={!!errors[field.name]} size="medium">
                      <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
                      <Select
                        {...controllerField}
                        labelId={`${field.name}-label`}
                        label={field.label}
                      >
                        {field.options?.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors[field.name] && (
                        <FormHelperText>{errors[field.name]?.message as string}</FormHelperText>
                      )}
                    </FormControl>
                  );
                }

                return (
                  <TextField
                    {...controllerField}
                    fullWidth
                    type={field.type}
                    label={field.label}
                    error={!!errors[field.name]}
                    helperText={errors[field.name]?.message as string}
                    variant="outlined"
                    InputLabelProps={field.type === 'date' ? { shrink: true } : {}}
                  />
                );
              }}
            />
          </Grid>
        ))}
      </Grid>
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        {onCancel && (
          <Button 
            variant="outlined" 
            color="inherit" 
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-600 border-gray-300"
          >
            {cancelLabel}
          </Button>
        )}
        <Button 
          type="submit" 
          variant="contained" 
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
