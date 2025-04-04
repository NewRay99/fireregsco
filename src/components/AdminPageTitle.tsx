import { ReactNode, cloneElement, isValidElement } from 'react';
import { SVGProps } from 'react';

interface AdminPageTitleProps {
  icon: ReactNode;
  title: string;
}

export default function AdminPageTitle({ icon, title }: AdminPageTitleProps) {
  const iconElement = isValidElement(icon) 
    ? cloneElement(icon as React.ReactElement<SVGProps<SVGSVGElement>>, { 
        className: 'w-10 h-10'
      })
    : icon;

  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-shrink-0 flex items-center justify-center h-10">
        {iconElement}
      </div>
      <h1 className="text-[28px] font-semibold h-10 flex items-center">{title}</h1>
    </div>
  );
} 