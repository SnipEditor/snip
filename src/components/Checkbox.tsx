import {useMemo} from "react";
import {Field, Label, Switch} from '@headlessui/react'
import useTheme from "../modules/useTheme.tsx";

export interface CheckboxProps {
    title: string;
    value: boolean;
    onChange: (newValue: boolean) => void;
}

export default function Checkbox({
    title,
    value,
    onChange,
}: CheckboxProps) {
    const theme = useTheme()
    const onChangeCallback = useMemo(() => {
        return () => onChange(!value)
    }, [value, onChange])

    return (
        <Field className="flex items-center justify-between">
      <span className="flex grow flex-col">
        <Label as="span" passive className="text-sm/6 font-medium" style={{color: theme.textColor}}>
          {title}
        </Label>

      </span>
            <Switch
                checked={value}
                onChange={onChangeCallback}
                className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[checked]:bg-indigo-600"
            >
        <span
            aria-hidden="true"
            className="pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out group-data-[checked]:translate-x-5"
        />
            </Switch>
        </Field>
    )
}