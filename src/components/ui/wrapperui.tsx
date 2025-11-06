type WrapperUIProps = {
  title: string;
  description?: string;
  newButtonLabel: string;
  disabled?: boolean;
  isCreating?: boolean;
} & (
  | { onNew: () => void;  newButtonHref?: never}
  | { newButtonHref: string; onNew?: never}
  | { newButtonHref: string; onNew?: never}
)
import { PlusIcon, SearchIcon } from "lucide-react";  
import { Button } from "./button";
import Link from "next/link";
import { Input } from "./input";
export const WrapperUI = ({
  title,
  description,
  newButtonLabel,
  disabled,
  isCreating,
  onNew,
  newButtonHref
}: WrapperUIProps) => {
  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-col">
        <h1 className="text-lg md:text-xl font-semibold">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      {onNew && !newButtonHref && (
        <Button onClick={onNew} disabled={disabled || isCreating} className="flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          {newButtonLabel}
        </Button>
      )}
      {newButtonHref && !onNew && (
        <Button asChild className="flex items-center gap-2">
          <Link href={newButtonHref} prefetch>
            <PlusIcon className="w-4 h-4" />
            {newButtonLabel}
          </Link>
        </Button>
      )}
    </div>
  );

};
type WrapperContainerProps = {
  children: React.ReactNode;
  header?: React.ReactNode;
  search?: React.ReactNode;
  pagination?: React.ReactNode;
}
export const WrapperContainer = ({
  children,
  header,
  search,
  pagination
}: WrapperContainerProps) => {
  return (
    <div className="p-4 md:px-10 md:py-6 h-full">
      <div className="mx-auto max-w-screen w-full flex flex-col gap-y-8 h-full">
        {header}
       
      <div className="flex flex-col gap-y-4 h-full">
        {search}
        {children}
      </div>
      {pagination}

    </div>
    </div>
  );
};

type WrapperSearchProps = {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export const WrapperSearch = ({ 
  placeholder, 
  value, 
  onChange 
}: WrapperSearchProps) => {
  return (
    <div className="relative">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};
