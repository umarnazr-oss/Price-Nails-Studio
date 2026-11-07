import type { MouseEvent, ReactNode } from 'react';

type RouteLinkProps = {
  to: string;
  navigate: (to: string) => void;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
};

export function RouteLink({ to, navigate, children, className, onClick, ...ariaProps }: RouteLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  };
  return <a href={to} className={className} onClick={handleClick} {...ariaProps}>{children}</a>;
}
