import { ChangeEvent, PropsWithChildren, useId, useMemo } from 'react'
import useTheme from '../modules/useTheme.tsx'

export interface DropdownProps extends PropsWithChildren {
  title: string
  value: string
  onChange: (newValue: string) => void
}

export default function Dropdown({
  title,
  value,
  onChange,
  children,
}: DropdownProps) {
  const id = useId()
  const theme = useTheme()

  const onChangeHandler = useMemo(() => {
    return (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)
  }, [onChange])

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm/6 font-medium"
        style={{ color: theme.textColor }}
      >
        {title}
      </label>
      <select id={id} value={value} onChange={onChangeHandler}>
        {children}
      </select>
    </div>
  )
}
