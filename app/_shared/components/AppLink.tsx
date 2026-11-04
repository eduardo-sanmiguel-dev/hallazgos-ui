import { forwardRef, type AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

// Keeps real anchors (copy/open in another tab) and MUI's href contract.
const AppLink = forwardRef<HTMLAnchorElement, Props>(function AppLink({ href, ...props }, ref) {
  if (!href.startsWith("/") || href.startsWith("//")) {
    return <a ref={ref} href={href} {...props} />;
  }
  return <Link ref={ref} to={href} {...props} />;
});
export default AppLink;
